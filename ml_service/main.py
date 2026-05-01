import cv2
import os
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector
from core.entities import Detection, IncidentEntry

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "vision", "models", "best.pt")

    try:
        camera = Camera(source=0)  # mudar dps pra receber o json
        detector = EPIDetector(model_path=model_path)
    except RuntimeError as e:
        print(f"Erro ao inicializar hardware: {e}")
        return
    except Exception as e:
        print(f"Erro ao carregar modelo em {model_path}: {e}")
        return

    print("--- Sistema ativo: Pressione 'ESC' para sair ---")

    try:
        while camera.is_opened():
            ret, frame = camera.read()

            if not ret:
                print("Falha na captura do frame.")
                break

            detections = detector.run(frame)
            incidents = detector.incidents(detections)

            annotated_frame = detector.annotate(frame, detections)
            cv2.imshow("Monitoramento EPI", annotated_frame)

            # TODO: fazer algo com os incidents (salvar, logar, enviar, etc.)

            if cv2.waitKey(1) & 0xFF == 27:  # ESC para sair
                break

    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("Recursos liberados.")

if __name__ == "__main__":
    main()