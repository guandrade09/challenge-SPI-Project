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

# Distância euclidiana MÁXIMA (embeddings normalizados, varia 0..2) pra aceitar que um
# rosto é a mesma pessoa de uma foto cadastrada. Calibrado com dados reais deste projeto
# (câmera via Wi-Fi/MJPEG, bastante perda de qualidade por compressão): a MESMA pessoa
# cadastrada mediu 0.84–0.90 contra o feed ao vivo nos logs — bem mais alto do que o valor
# citado em tutoriais com fotos de estúdio (~0.6–0.8). Se pessoas cadastradas ainda
# caírem como "Desconhecido" com frequência, suba este valor; se pessoas não cadastradas
# começarem a ser reconhecidas, desça — acompanhe pelo log
# "[FACIAL] rosto → '...' (distância: X.XXX, ...)".
MAX_MATCH_DISTANCE_DEFAULT = 1.0
DETECTION_PROB_MINIMO = 0.9


def _confidence_from_distance(dist: float) -> float:
    """Converte a distância euclidiana entre dois embeddings normalizados (unitários) em
    uma confiança 0..1 mais intuitiva pra exibição, via similaridade de cosseno
    (dist² = 2 − 2·cos_sim e cos_sim ∈ [-1, 1] → confiança ∈ [0, 1]). Independente de
    MAX_MATCH_DISTANCE: aqui só decidimos o número exibido, não se o rosto é aceito."""
    cos_sim = 1.0 - (dist ** 2) / 2.0
    return round(max(0.0, min(1.0, (cos_sim + 1.0) / 2.0)), 4)


class FaceRecognizer:
    def __init__(
        self,
        device: str | None = None,
        max_match_distance: float = MAX_MATCH_DISTANCE_DEFAULT,
    ):
        # Import tardio: torch/facenet-pytorch são pesados e opcionais — se não estiverem
        # instalados, quem chama (orquestrador/main.py) captura a exceção e desativa só
        # esta feature, sem derrubar EPI/ergonomia/zona.
        import torch
        from facenet_pytorch import MTCNN, InceptionResnetV1

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.max_match_distance = max_match_distance
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
        """Detecta todos os rostos do frame e casa CADA UM independentemente com o
        funcionário cadastrado de embedding mais próximo. Só assume essa identidade se a
        distância for <= max_match_distance; caso contrário (ou se `known` estiver vazio)
        o rosto volta como "Desconhecido" — importante com 2+ pessoas em cena: o rosto de
        alguém não cadastrado não deve "virar" o funcionário mais parecido só porque é o
        único candidato disponível. `known`:
        {funcionario_id: {"nome": str, "embeddings": list[np.ndarray]}} — um funcionário
        pode ter até 3 fotos de referência, cada uma com seu embedding; casa contra a
        MELHOR delas (menor distância)."""
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
            # Confiança só é um número com significado quando HÁ identidade atribuída — a
            # conversão distância→confiança não é linear, então um "Desconhecido" rejeitado
            # podia mostrar uma % enganosamente alta na tela. Zera pra exibição nesse caso;
            # o valor real continua no log acima, pra calibrar max_match_distance.
            matches.append(FaceMatch(
                nome=nome,
                confidence=confidence if funcionario_id is not None else 0.0,
                x1=float(x1), y1=float(y1), x2=float(x2), y2=float(y2),
                funcionario_id=funcionario_id,
            ))
        return matches

    def _best_match(self, embedding: np.ndarray, known: dict[int, dict]) -> tuple[int | None, str, float, float]:
        if not known:
            return None, "Desconhecido", 0.0, float("inf")

        best_id, best_nome, best_dist = None, "Desconhecido", float("inf")
        for funcionario_id, info in known.items():
            # compara contra TODAS as fotos de referência do funcionário, fica com a
            # menor distância entre elas — uma foto de ângulo/luz parecido já basta.
            for ref_embedding in info["embeddings"]:
                dist = float(np.linalg.norm(embedding - ref_embedding))
                if dist < best_dist:
                    best_id, best_nome, best_dist = funcionario_id, info["nome"], dist

        confidence = _confidence_from_distance(best_dist)

        if best_dist > self.max_match_distance:
            # O "mais parecido" não é parecido o suficiente — não assume a identidade.
            # Mantém a distância/confiança real no retorno (útil pra calibrar o limiar
            # pelos logs), só zera o funcionário/nome atribuído.
            return None, "Desconhecido", confidence, best_dist

        return best_id, best_nome, confidence, best_dist


MAX_FOTOS_FUNCIONARIO = 3  # mantido em espelho com backend/src/api/models/funcionario.model.js


class FuncionarioFaceRegistry:
    """Mantém em memória {funcionario_id: {"nome", "embeddings"}} pronto para
    FaceRecognizer.identify(). Sincroniza com o backend (GET/PUT /api/funcionarios):
    calcula o embedding de cada foto cadastrada (até MAX_FOTOS_FUNCIONARIO, lidas do
    disco — o orquestrador roda na mesma máquina que o backend) e grava o resultado de
    volta no banco (face_encodings) pra não recalcular a cada reinício."""

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
            embeddings = self._load_or_compute_embeddings(funcionario)
            if not embeddings:
                continue
            known[funcionario["id"]] = {"nome": funcionario["nome"], "embeddings": embeddings}

        self._known = known
        print(f"[FACIAL] {len(known)} funcionário(s) prontos para reconhecimento.")

    def _load_or_compute_embeddings(self, funcionario: dict) -> list[np.ndarray]:
        cached = funcionario.get("face_encodings")
        if cached:
            try:
                parsed = json.loads(cached)
                embeddings = [np.array(e, dtype=np.float32) for e in parsed if e]
                if embeddings:
                    return embeddings
            except (ValueError, TypeError):
                pass  # cache corrompido — recalcula abaixo

        fotos = funcionario.get("fotos") or []
        if isinstance(fotos, str):
            # compat: resposta antiga da API podia mandar a string JSON crua
            try:
                fotos = json.loads(fotos)
            except (ValueError, TypeError):
                fotos = [fotos]

        embeddings: list[np.ndarray] = []
        for foto_path in fotos[:MAX_FOTOS_FUNCIONARIO]:
            if not foto_path or not os.path.exists(foto_path):
                continue
            frame = cv2.imread(foto_path)
            if frame is None:
                continue
            embedding = self._recognizer.compute_embedding(frame)
            if embedding is None:
                print(f"[FACIAL] Nenhum rosto encontrado numa foto de '{funcionario.get('nome')}'.")
                continue
            embeddings.append(embedding)

        if embeddings:
            self._cache_embeddings(funcionario["id"], embeddings)
        return embeddings

    def _cache_embeddings(self, funcionario_id: int, embeddings: list[np.ndarray]):
        try:
            requests.put(
                f"{self._backend_url}/{funcionario_id}",
                json={"face_encodings": [e.tolist() for e in embeddings]},
                timeout=5,
            )
        except Exception as e:
            print(f"[FACIAL] Não foi possível salvar os embeddings de funcionário {funcionario_id}: {e}")
