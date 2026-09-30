"""
ml_facial — Reconhecimento Facial
==================================
Detecta e reconhece rostos usando MTCNN (detecção/alinhamento) + FaceNet (embedding via
InceptionResnetV1 pré-treinada em VGGFace2), da biblioteca facenet-pytorch.

Escolhido no lugar de dlib/face_recognition porque é 100% PyTorch — sem dependência de
compilador C++/CMake, que costuma travar a instalação em máquinas Windows. O projeto já
depende de torch via ultralytics, então não é uma dependência pesada nova.

Uso, no mesmo espírito de ml_service.inference.detector.EPIDetector:
    recognizer = FaceRecognizer()
    embedding  = recognizer.compute_embedding(frame)               # cadastro (1 rosto)
    matches    = recognizer.identify(frame, known=registry.known_embeddings())  # ao vivo
"""
from __future__ import annotations

import json
import os
import time

import cv2
import numpy as np
import requests

from core.entities import FaceMatch

# Não há rejeição por limiar: identify() sempre casa com o funcionário cadastrado mais
# próximo (por pedido explícito — priorizar nunca deixar "Desconhecido" quando existe
# gente cadastrada). Este valor só normaliza a distância num "confidence" 0..1 pra
# exibição — não decide mais se o rosto é aceito ou rejeitado.
MATCH_THRESHOLD_DEFAULT = 1.2
DETECTION_PROB_MINIMO = 0.9


class FaceRecognizer:
    def __init__(self, device: str | None = None, match_threshold: float = MATCH_THRESHOLD_DEFAULT):
        # Import tardio: torch/facenet-pytorch são pesados e opcionais — se não estiverem
        # instalados, quem chama (orquestrador/main.py) captura a exceção e desativa só
        # esta feature, sem derrubar EPI/ergonomia/zona.
        import torch
        from facenet_pytorch import MTCNN, InceptionResnetV1

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.match_threshold = match_threshold
        self._torch = torch
        self._mtcnn = MTCNN(keep_all=True, device=self.device, post_process=True)
        self._resnet = InceptionResnetV1(pretrained="vggface2").eval().to(self.device)
        print(f"[FACIAL] Modelo de reconhecimento facial carregado ({self.device}).")

    @staticmethod
    def _bgr_to_rgb(frame: np.ndarray) -> np.ndarray:
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    def compute_embedding(self, frame: np.ndarray) -> np.ndarray | None:
        """Usado no cadastro: extrai o embedding do maior rosto encontrado na foto."""
        rgb = self._bgr_to_rgb(frame)
        faces = self._mtcnn(rgb)
        if faces is None:
            return None
        face = faces[0] if faces.dim() == 4 else faces
        with self._torch.no_grad():
            embedding = self._resnet(face.unsqueeze(0).to(self.device))
        return embedding[0].cpu().numpy()

    def identify(self, frame: np.ndarray, known: dict[int, dict]) -> list[FaceMatch]:
        """Detecta todos os rostos do frame e casa CADA UM com o funcionário cadastrado
        de embedding mais próximo, sem rejeição por distância — se existe pelo menos um
        funcionário em `known`, o rosto sempre volta associado a alguém (o mais parecido
        disponível); só volta "Desconhecido" se `known` estiver vazio (ninguém cadastrado
        ainda). `known`: {funcionario_id: {"nome": str, "embedding": np.ndarray}}."""
        rgb = self._bgr_to_rgb(frame)
        boxes, probs = self._mtcnn.detect(rgb)
        if boxes is None:
            return []

        faces = self._mtcnn.extract(rgb, boxes, save_path=None)
        if faces is None:
            return []

        with self._torch.no_grad():
            embeddings = self._resnet(faces.to(self.device)).cpu().numpy()

        matches: list[FaceMatch] = []
        for (x1, y1, x2, y2), prob, embedding in zip(boxes, probs, embeddings):
            if prob is None or prob < DETECTION_PROB_MINIMO:
                continue
            funcionario_id, nome, confidence, best_dist = self._best_match(embedding, known)
            print(f"[FACIAL] rosto → '{nome}' (distância: {best_dist:.3f}, confiança: {confidence:.2f}).")
            matches.append(FaceMatch(
                nome=nome,
                confidence=confidence,
                x1=float(x1), y1=float(y1), x2=float(x2), y2=float(y2),
                funcionario_id=funcionario_id,
            ))
        return matches

    def _best_match(self, embedding: np.ndarray, known: dict[int, dict]) -> tuple[int | None, str, float, float]:
        if not known:
            return None, "Desconhecido", 0.0, float("inf")

        best_id, best_nome, best_dist = None, "Desconhecido", float("inf")
        for funcionario_id, info in known.items():
            dist = float(np.linalg.norm(embedding - info["embedding"]))
            if dist < best_dist:
                best_id, best_nome, best_dist = funcionario_id, info["nome"], dist

        # Distância euclidiana entre embeddings normalizados (unitários) varia de 0 a 2 —
        # convertida aqui só pra uma confiança 0..1 de exibição, sem gatilho de rejeição.
        confidence = round(max(0.0, 1.0 - (best_dist / self.match_threshold)), 4)
        return best_id, best_nome, confidence, best_dist


class FuncionarioFaceRegistry:
    """Mantém em memória {funcionario_id: {"nome", "embedding"}} pronto para
    FaceRecognizer.identify(). Sincroniza com o backend (GET/PUT /api/funcionarios):
    calcula o embedding uma vez por funcionário (a partir de foto_path, lido do disco — o
    orquestrador roda na mesma máquina que o backend) e grava o resultado de volta no
    banco (face_encoding) pra não recalcular a cada reinício."""

    def __init__(self, recognizer: FaceRecognizer, backend_url: str, refresh_interval_s: float = 30.0):
        self._recognizer = recognizer
        self._backend_url = backend_url.rstrip("/")
        self._refresh_interval_s = refresh_interval_s
        self._known: dict[int, dict] = {}
        self._last_refresh = 0.0

    def known_embeddings(self) -> dict[int, dict]:
        return self._known

    def refresh_if_needed(self):
        now = time.time()
        if now - self._last_refresh < self._refresh_interval_s:
            return
        self._last_refresh = now
        self._refresh()

    def _refresh(self):
        try:
            resp = requests.get(self._backend_url, timeout=5)
            resp.raise_for_status()
            funcionarios = resp.json().get("data", [])
        except Exception as e:
            print(f"[FACIAL] Não foi possível sincronizar funcionários com o backend: {e}")
            return

        known: dict[int, dict] = {}
        for funcionario in funcionarios:
            if (funcionario.get("status") or "ativo") != "ativo":
                continue
            embedding = self._load_or_compute_embedding(funcionario)
            if embedding is None:
                continue
            known[funcionario["id"]] = {"nome": funcionario["nome"], "embedding": embedding}

        self._known = known
        print(f"[FACIAL] {len(known)} funcionário(s) prontos para reconhecimento.")

    def _load_or_compute_embedding(self, funcionario: dict) -> np.ndarray | None:
        cached = funcionario.get("face_encoding")
        if cached:
            try:
                return np.array(json.loads(cached), dtype=np.float32)
            except (ValueError, TypeError):
                pass  # cache corrompido — recalcula abaixo

        foto_path = funcionario.get("foto_path")
        if not foto_path or not os.path.exists(foto_path):
            return None

        frame = cv2.imread(foto_path)
        if frame is None:
            return None

        embedding = self._recognizer.compute_embedding(frame)
        if embedding is None:
            print(f"[FACIAL] Nenhum rosto encontrado na foto de '{funcionario.get('nome')}'.")
            return None

        self._cache_embedding(funcionario["id"], embedding)
        return embedding

    def _cache_embedding(self, funcionario_id: int, embedding: np.ndarray):
        try:
            requests.put(
                f"{self._backend_url}/{funcionario_id}",
                json={"face_encoding": embedding.tolist()},
                timeout=5,
            )
        except Exception as e:
            print(f"[FACIAL] Não foi possível salvar o embedding de funcionário {funcionario_id}: {e}")
