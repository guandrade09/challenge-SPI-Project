import cv2
import os
import base64
import requests
import threading
from datetime import datetime
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from ml_service.streaming.websocket_server import send_frame, start_server_in_thread


def post_incident(payload):
    try:
        response = requests.post(
            "http://localhost:3000/api/detections",
            json=payload,
            timeout=2
        )
        if response.status_code in (200, 201):
            print(f"✓ Incidente enviado: {payload['label']} ({payload['confidence']})")
        else:
            print(f"✗ Erro na API: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Falha no POST: {e}")


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

    start_server_in_thread()

    print("--- Sistema ativo: Pressione 'ESC' para sair ---")
    # cv2.namedWindow("Monitoramento EPI", cv2.WINDOW_NORMAL)
    # cv2.resizeWindow("Monitoramento EPI", 1280, 720)

    try:
        while camera.is_opened():
            ret, frame = camera.read()
            if not ret:
                print("Falha na captura do frame.")
                break

            results = detector.model(frame, conf=detector.conf, verbose=False)
            result  = results[0]

            detections = detector.run(frame)
            incidents  = detector.incidents(detections)
            confirmed  = debouncer.update(incidents)

            annotated_frame = result.plot()

            send_frame(annotated_frame)
            # cv2.imshow("Monitoramento EPI", annotated_frame)

            for detection in confirmed:
                timestamp = datetime.now()
                _, buffer = cv2.imencode('.jpg', frame)
                img_frame_b64 = base64.b64encode(buffer).decode('utf-8')

                payload = {
                    "timestamp": timestamp.isoformat(),
                    "label": detection.label,
                    "confidence": round(float(detection.confidence), 4),
                    "img_Frame": img_frame_b64
                }

                threading.Thread(
                    target=post_incident,
                    args=(payload,),
                    daemon=True
                ).start()

            if cv2.waitKey(1) & 0xFF == 27:
                break

    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("Recursos liberados.")


if __name__ == "__main__":
    main()