import cv2
import os
from inference.camera import Camera
from inference.detector import ModeloCapacete

def detectorTeste():

    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "vision", "models", "best.pt")

    try:
        camera = Camera(source=0)
        detector = ModeloCapacete(model_path=model_path)
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

            results = detector.detect(frame)
            annotated_frame = detector.annotate(frame, results)

            cv2.imshow("Monitoramento EPI", annotated_frame)

            # 27 é o código ASCII para a tecla ESC
            if cv2.waitKey(1) & 0xFF == 27:
                break
                
    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("Recursos liberados.")

if __name__ == "__main__":
    detectorTeste()