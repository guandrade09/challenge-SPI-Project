import cv2
import os
import base64
import requests
from datetime import datetime
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from core.entities import IncidentEntry

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "vision", "models", "best.pt")

    try:
        camera = Camera(source=0)
        camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        detector = EPIDetector(model_path=model_path)
        debouncer = IncidentDebouncer(required_frames=10, cooldown_frames=60)
    except RuntimeError as e:
        print(f"Erro ao inicializar: {e}")
        return
    except Exception as e:
        print(f"Erro ao carregar modelo em {model_path}: {e}")
        return

    print("--- Sistema ativo: Pressione 'ESC' para sair ---")

    cv2.namedWindow("Monitoramento EPI", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Monitoramento EPI", 1280, 720)

    try:
        while camera.is_opened():
            ret, frame = camera.read()

            if not ret:
                print("Falha na captura do frame.")
                break

            detections = detector.run(frame)
            incidents = detector.incidents(detections)
            confirmed = debouncer.update(incidents)

            annotated_frame = detector.annotate(frame)
            cv2.imshow("Monitoramento EPI", annotated_frame)

            for detection in confirmed:
                timestamp = datetime.now()

                # Converte frame pra base64
                _, buffer = cv2.imencode('.jpg', frame)
                img_frame_b64 = base64.b64encode(buffer).decode('utf-8')

                incident = IncidentEntry(
                    label=detection.label,
                    confidence=detection.confidence,
                    timestamp=timestamp,
                    img_path=""
                )

                payload = {
                    "timestamp": incident.timestamp.isoformat(),
                    "label": incident.label,
                    "confidence": float(incident.confidence),
                    "img_Frame": img_frame_b64
                }

                try:
                    response = requests.post(
                        "http://localhost:3000/api/detections",
                        json=payload,
                        timeout=2
                    )
                    if response.status_code in (200, 201):
                        print(f"✓ Incidente enviado: {incident.label} ({incident.confidence:.2f})")
                    else:
                        print(f"✗ Erro na API: {response.status_code} {response.text}")

                except requests.exceptions.RequestException as e:
                    print(f"✗ Falha no POST: {e}")

            if cv2.waitKey(1) & 0xFF == 27:
                break

    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("Recursos liberados.")

if __name__ == "__main__":
    main()