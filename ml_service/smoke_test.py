import cv2
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector

MODEL_PATH = "ml_service/vision/models/best.pt"

def main():
    print("[1] Inicializando câmera...")
    camera = Camera(source=0)



    
    if not camera.cap.isOpened():
        raise RuntimeError("Câmera não abriu. Verifique o source.")
    print("    ✓ Câmera OK")

    camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("[2] Carregando modelo YOLO...")

    cv2.namedWindow("SPI - Smoke Test", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("SPI - Smoke Test", 1280, 720)

    detector = EPIDetector(model_path=MODEL_PATH, conf=0.5)
    print(f"    ✓ Modelo carregado — classes: {detector.model.names}")

    print("[3] Iniciando loop de captura (pressione Q para sair)...")
    frame_count = 0

    while True:
        ret, frame = camera.cap.read()

        if not ret:
            print("    ✗ Frame não capturado. Encerrando.")
            break

        frame_count += 1

        # Roda detecção a cada 5 frames pra não sobrecarregar
        if frame_count % 5 == 0:
            detections = detector.run(frame)
            incidents = detector.incidents(detections)

            print(f"    Frame {frame_count} | Detecções: {len(detections)} | Incidentes: {len(incidents)}")
            for inc in incidents:
                print(f"      → {inc.label} (conf: {inc.confidence:.2f})")

        # Mostra frame anotado
        annotated = detector.annotate(frame)
        cv2.imshow("SPI - Smoke Test", annotated)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    camera.cap.release()
    cv2.destroyAllWindows()
    print("[4] Encerrado com sucesso.")

if __name__ == "__main__":
    main()