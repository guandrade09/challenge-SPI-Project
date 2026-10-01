import os
import math
import cv2
import base64
import requests
import numpy as np
from core.entities import Detection
from ml_service.inference.model_loader import load_yolo_with_engine_fallback

ROBOFLOW_API_KEY  = "jeWHRTzYcXTuBLZjd90v"
ROBOFLOW_MODEL    = "spi-challenge/10"
# Permite apontar para um Inference Server local (ex.: http://localhost:9001) sem mudar
# código — mesmo projeto/versão do modelo, só troca onde a inferência roda.
ROBOFLOW_BASE_URL = os.environ.get("ROBOFLOW_BASE_URL", "https://serverless.roboflow.com")
ROBOFLOW_URL      = f"{ROBOFLOW_BASE_URL}/{ROBOFLOW_MODEL}?api_key={ROBOFLOW_API_KEY}"


class IncidentDebouncer:
    # Não existe tracking real no projeto (sem track_id/ByteTrack/DeepSort) — este é um
    # pareamento mínimo por proximidade de centro entre frames, só para o debounce não
    # misturar duas pessoas diferentes. Não é reidentificação de longo prazo.
    _MAX_MATCH_DIST_PX = 120

    def __init__(self, required_frames: int = 10, cooldown_frames: int = 60):
        self._counters: dict[tuple[int, str], int] = {}
        self._active:   set[tuple[int, str]]        = set()  # (pessoa, label) já confirmados, aguardando a infração sumir
        self.required_frames = required_frames
        self.cooldown_frames = cooldown_frames  # mantido pela API; não usado no latch (ver update)

        self._person_centroids: dict[int, tuple[float, float]] = {}
        self._next_person_id = 0

    def _match_person(self, center: tuple[float, float], claimed: set[int]) -> int:
        """Reaproveita o slot de pessoa conhecido mais próximo do centro dado (ainda não
        reivindicado neste frame); cria um slot novo se nenhum estiver perto o suficiente."""
        best_id, best_dist = None, self._MAX_MATCH_DIST_PX
        for pid, prev_center in self._person_centroids.items():
            if pid in claimed:
                continue
            dist = math.hypot(center[0] - prev_center[0], center[1] - prev_center[1])
            if dist <= best_dist:
                best_id, best_dist = pid, dist
        if best_id is None:
            best_id = self._next_person_id
            self._next_person_id += 1
        self._person_centroids[best_id] = center
        claimed.add(best_id)
        return best_id

    def _assign_people(self, all_detections: list) -> list[tuple]:
        """Retorna [(incidente, pessoa_id), ...], usando as caixas 'PESSOA' do mesmo frame
        como âncora. Sem nenhuma 'PESSOA' visível, cada item de risco vira seu próprio slot
        (fallback — evita perder o incidente por falta de âncora)."""
        pessoas = [d for d in all_detections if d.label.startswith("PESSOA")]
        riscos  = [d for d in all_detections if d.is_risk]
        claimed: set[int] = set()
        pessoa_ids = [self._match_person((p.center_x, p.center_y), claimed) for p in pessoas]

        pares = []
        for d in riscos:
            if not pessoas:
                pares.append((d, self._match_person((d.center_x, d.center_y), claimed)))
                continue
            melhor_idx, melhor_dist = None, float("inf")
            for idx, p in enumerate(pessoas):
                if p.x1 <= d.center_x <= p.x2 and p.y1 <= d.center_y <= p.y2:
                    melhor_idx = idx
                    break
                dist = math.hypot(d.center_x - p.center_x, d.center_y - p.center_y)
                if dist < melhor_dist:
                    melhor_idx, melhor_dist = idx, dist
            pares.append((d, pessoa_ids[melhor_idx]))
        return pares

    def update(self, incidents: list, all_detections: list | None = None) -> list:
        pares = self._assign_people(all_detections if all_detections is not None else incidents)
        confirmed = []
        active_keys = {(pid, inc.label) for inc, pid in pares}

        # sumiu deste frame → libera pra confirmar de novo se a infração voltar
        for key in list(self._active):
            if key not in active_keys:
                self._active.discard(key)
        for key in list(self._counters):
            if key not in active_keys:
                self._counters[key] = 0

        for inc, pid in pares:
            key = (pid, inc.label)
            if key in self._active:
                continue
            self._counters[key] = self._counters.get(key, 0) + 1
            if self._counters[key] >= self.required_frames:
                confirmed.append(inc)
                self._counters[key] = 0
                self._active.add(key)

        return confirmed


class EPIDetector:
    """
    Detecta EPIs usando Roboflow REST API como primário.
    Cai automaticamente para o modelo local (best2.pt) se o Roboflow falhar.
    """

    def __init__(self, model_path: str, conf: float = 0.5, imgsz: int = 320):
        self.conf       = conf
        self.model_path = model_path
        self.imgsz      = imgsz
        self._mode      = "roboflow"

        # Carrega modelo local sempre (fallback) — usa .engine (TensorRT) se disponível
        if not os.path.exists(model_path):
            raise RuntimeError(f"Modelo local não encontrado: {model_path}")
        self.model = load_yolo_with_engine_fallback(model_path, imgsz=imgsz)
        print(f"[EPI] Modelo local carregado: {model_path} (fallback)")

    def run(self, frame: np.ndarray, lock=None) -> list[Detection]:
        """`lock` (opcional): lock de inferência compartilhado. Só é segurado durante a
        inferência local na GPU — a chamada HTTP do Roboflow roda sem ele, pra não
        bloquear os outros setores enquanto espera a rede."""
        if self._mode == "roboflow":
            try:
                return self._run_roboflow(frame)
            except Exception as e:
                print(f"[EPI] Roboflow falhou ({e}) — alternando para modelo local.")
                self._mode = "local"
        if lock is None:
            return self._run_local(frame)
        with lock:
            return self._run_local(frame)

    def _run_roboflow(self, frame: np.ndarray) -> list[Detection]:
        """Envia frame como JPEG base64 para a API REST do Roboflow."""
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        img_b64 = base64.b64encode(buf).decode("utf-8")

        r = requests.post(
            ROBOFLOW_URL,
            data=img_b64,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        r.raise_for_status()
        result = r.json()

        detections = []
        for pred in result.get("predictions", []):
            confidence = float(pred["confidence"])
            if confidence < self.conf:
                continue
            label = pred["class"]
            x, y, w, h = pred["x"], pred["y"], pred["width"], pred["height"]
            x1, y1 = int(x - w / 2), int(y - h / 2)
            x2, y2 = int(x + w / 2), int(y + h / 2)
            detections.append(Detection(
                label=label, confidence=confidence,
                x1=x1, y1=y1, x2=x2, y2=y2,
            ))
        return detections

    def _run_local(self, frame: np.ndarray) -> list[Detection]:
        results = self.model(frame, conf=self.conf, verbose=False, imgsz=self.imgsz)
        detections = []
        for result in results:
            for box in result.boxes:
                label      = result.names[int(box.cls[0])]
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append(Detection(
                    label=label, confidence=confidence,
                    x1=x1, y1=y1, x2=x2, y2=y2,
                ))
        return detections

    def incidents(self, detections: list[Detection]) -> list[Detection]:
        return [d for d in detections if d.is_risk]

    def annotate(self, frame: np.ndarray):
        # imgsz precisa bater com o que foi usado no export do .engine (ver model_loader.py) —
        # um TensorRT engine é compilado pra um tamanho de entrada fixo.
        results = self.model(frame, conf=self.conf, verbose=False, imgsz=self.imgsz)
        return results[0].plot()