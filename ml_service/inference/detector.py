import os
from ultralytics import YOLO
from core.entities import Detection


class IncidentDebouncer:
    def __init__(self, required_frames: int = 10, cooldown_frames: int = 60):
        self._counters: dict[str, int] = {}
        self._cooldowns: dict[str, int] = {}
        self.required_frames = required_frames
        self.cooldown_frames = cooldown_frames

    def update(self, incidents: list) -> list:
        confirmed = []
        active_labels = {inc.label for inc in incidents}

        # Decrementa cooldowns
        for label in list(self._cooldowns):
            self._cooldowns[label] -= 1
            if self._cooldowns[label] <= 0:
                del self._cooldowns[label]

        # Reseta contadores de labels que sumiram
        for label in list(self._counters):
            if label not in active_labels:
                self._counters[label] = 0

        # Incrementa contadores das labels ativas
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
    def __init__(self, model_path: str, conf: float = 0.5):
        if not os.path.exists(model_path):
            raise RuntimeError(f"Modelo não encontrado: {model_path}")

        self.model = YOLO(model_path)
        self.conf = conf

    def run(self, frame) -> list[Detection]:
        results = self.model(frame, conf=self.conf, verbose=False)
        detections = []

        for result in results:
            for box in result.boxes:
                label = result.names[int(box.cls[0])]
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                detections.append(
                    Detection(
                        label=label,
                        confidence=confidence,
                        x1=x1,
                        y1=y1,
                        x2=x2,
                        y2=y2
                    )
                )

        return detections

    def incidents(self, detections: list[Detection]) -> list[Detection]:
        return [d for d in detections if d.is_risk]

    def annotate(self, frame):
        results = self.model(frame, conf=self.conf, verbose=False)
        return results[0].plot()
        