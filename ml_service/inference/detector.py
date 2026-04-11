import os
from ultralytics import YOLO
from core.entities import Detection

class EPIDetector:
    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise RuntimeError(f"Modelo não encontrado: {model_path}")
        self.model = YOLO(model_path)

    def run(self, frame) -> list[Detection]:
        results = self.model(frame)
        detections = []
        for result in results:
            for box in result.boxes:
                label      = result.names[int(box.cls[0])]
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