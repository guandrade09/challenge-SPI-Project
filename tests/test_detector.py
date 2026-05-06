import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__ + "/..")))

import cv2
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector

def main():
    camera   = Camera(0)
    detector = EPIDetector("ml_service/models/best.pt")

    print("Iniciando detecção...")

    while True:
        ret, frame = camera.read()

        if not ret:
            print("Falha ao ler frame")
            break

        detections = detector.run(frame)

        for d in detections:
            print(f"{d.label} | conf: {d.confidence:.2%} | risco: {d.is_risk}")

        cv2.imshow("Detector Test", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    camera.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()