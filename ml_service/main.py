from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector
from core.entities import Detection, IncidentEntry

def main():
    camera = Camera(0) #mudar dps pra receber o json
    detector =  EPIDetector("ml_service/models/best.py")


while True:
    ret, frame = camera.read()

    if not ret:
        break

    detections = detector.run(frame)
    incidents  = detector.incidents(detections)
