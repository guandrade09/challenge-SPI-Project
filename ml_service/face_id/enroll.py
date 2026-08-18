"""Cadastro de rosto: captura N amostras da webcam e salva os embeddings no banco local.

Uso:
    python -m ml_service.face_id.enroll "Nome da Pessoa"

Controles durante a captura:
    ESPAÇO  -> captura uma amostra do rosto detectado
    ESC     -> cancela
"""
import sys

import cv2

from ml_service.inference.camera import Camera
from ml_service.face_id.recognizer import FaceRecognizer
from ml_service.face_id.database import FaceDatabase

SAMPLES_REQUIRED = 5


def main():
    if len(sys.argv) < 2:
        print('Uso: python -m ml_service.face_id.enroll "Nome da Pessoa"')
        return

    name = sys.argv[1].strip()
    if not name:
        print("Nome inválido.")
        return

    recognizer = FaceRecognizer()
    database = FaceDatabase()

    try:
        camera = Camera(source=0)
    except RuntimeError as e:
        print(f"Erro ao abrir câmera: {e}")
        return

    print(f"--- Cadastro de '{name}' ---")
    print(f"Posicione o rosto e pressione ESPAÇO para capturar ({SAMPLES_REQUIRED} amostras). ESC para cancelar.")

    captured = 0
    try:
        while camera.is_opened() and captured < SAMPLES_REQUIRED:
            ret, frame = camera.read()
            if not ret:
                print("Falha na captura do frame.")
                break

            faces = recognizer.detect(frame)
            display = frame.copy()

            face_row = None
            if faces is not None and len(faces) > 0:
                face_row = faces[0]
                x, y, w, h = face_row[:4].astype(int)
                cv2.rectangle(display, (x, y), (x + w, y + h), (0, 255, 0), 2)

            cv2.putText(display, f"Amostras: {captured}/{SAMPLES_REQUIRED}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            cv2.imshow("Cadastro facial - ESPACO captura, ESC cancela", display)

            key = cv2.waitKey(1) & 0xFF
            if key == 27:  # ESC
                print("Cadastro cancelado.")
                break
            if key == 32 and face_row is not None:  # ESPAÇO
                embedding = recognizer.embed(frame, face_row)
                database.add(name, embedding)
                captured += 1
                print(f"✓ Amostra {captured}/{SAMPLES_REQUIRED} capturada.")
            elif key == 32:
                print("✗ Nenhum rosto detectado, tente novamente.")

        if captured == SAMPLES_REQUIRED:
            print(f"Cadastro de '{name}' concluído com {captured} amostras.")

    finally:
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
