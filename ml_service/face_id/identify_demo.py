"""Demo de reconhecimento facial ao vivo: identifica rostos cadastrados na webcam.

Uso:
    python -m ml_service.face_id.identify_demo

ESC para sair.
"""
import cv2

from ml_service.inference.camera import Camera
from ml_service.face_id.recognizer import FaceRecognizer
from ml_service.face_id.database import FaceDatabase


def main():
    recognizer = FaceRecognizer()
    database = FaceDatabase()

    if not database.names():
        print("Nenhuma pessoa cadastrada ainda. Rode primeiro:")
        print('  python -m ml_service.face_id.enroll "Nome da Pessoa"')
        return

    try:
        camera = Camera(source=0)
    except RuntimeError as e:
        print(f"Erro ao abrir câmera: {e}")
        return

    print(f"Pessoas cadastradas: {', '.join(database.names())}")
    print("--- Reconhecimento ativo: ESC para sair ---")

    try:
        while camera.is_opened():
            ret, frame = camera.read()
            if not ret:
                print("Falha na captura do frame.")
                break

            faces = recognizer.detect(frame)

            if faces is not None:
                for face_row in faces:
                    embedding = recognizer.embed(frame, face_row)
                    name, score = recognizer.best_match(embedding, database)

                    x, y, w, h = face_row[:4].astype(int)
                    label = f"{name} ({score:.2f})" if name else f"Desconhecido ({score:.2f})"
                    color = (0, 200, 0) if name else (0, 0, 255)

                    cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                    cv2.putText(frame, label, (x, max(y - 10, 0)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            cv2.imshow("Reconhecimento facial - ESC sai", frame)

            if cv2.waitKey(1) & 0xFF == 27:
                break

    finally:
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
