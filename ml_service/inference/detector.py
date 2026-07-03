import os
import cv2
import base64
import requests
import numpy as np
from ultralytics import YOLO
from core.entities import Detection

ROBOFLOW_API_KEY = "jeWHRTzYcXTuBLZjd90v"
ROBOFLOW_MODEL   = "spi-challenge/9"
ROBOFLOW_URL     = f"https://serverless.roboflow.com/{ROBOFLOW_MODEL}?api_key={ROBOFLOW_API_KEY}"


class IncidentDebouncer:
    def __init__(self, required_frames: int = 10, cooldown_frames: int = 60):
        self._counters: dict[str, int]  = {}
        self._cooldowns: dict[str, int] = {}
        self.required_frames = required_frames
        self.cooldown_frames = cooldown_frames

    def update(self, incidents: list) -> list:
        confirmed = []
        active_labels = {inc.label for inc in incidents}

        for label in list(self._cooldowns):
            self._cooldowns[label] -= 1
            if self._cooldowns[label] <= 0:
                del self._cooldowns[label]

        for label in list(self._counters):
            if label not in active_labels:
                self._counters[label] = 0

        for inc in incidents:
            label = inc.label
            if label in self._cooldowns:
                continue
            self._counters[label] = self._counters.get(label, 0) + 1
            if self._counters[label] >= self.required_frames:
                confirmed.append(inc)
                self._counters[label] = 0
                self._cooldowns[label] = self.cooldown_frames

        return confirmed


class EPIDetector:
    """
    Detecta EPIs usando Roboflow REST API como primário.
    Cai automaticamente para o modelo local (best10.pt) se o Roboflow falhar.
    """

    def __init__(self, model_path: str, conf: float = 0.5):
        self.conf       = conf
        self.model_path = model_path
        self._mode      = "roboflow"

        # Carrega modelo local sempre (fallback)
        if not os.path.exists(model_path):
            raise RuntimeError(f"Modelo local não encontrado: {model_path}")
        self.model = YOLO(model_path)
        print(f"[EPI] Modelo local carregado: {model_path} (fallback)")

    def run(self, frame: np.ndarray) -> list[Detection]:
        if self._mode == "roboflow":
            try:
                return self._run_roboflow(frame)
            except Exception as e:
                print(f"[EPI] Roboflow falhou ({e}) — alternando para modelo local.")
                self._mode = "local"
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
        results = self.model(frame, conf=self.conf, verbose=False, imgsz=320)
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
        results = self.model(frame, conf=self.conf, verbose=False)
        return results[0].plot()