import cv2


class Camera:
    def __init__(self, source=0):
        # CAP_DSHOW só se aplica a índices de dispositivo local (Windows).
        # RTSP usa o FFmpeg do OpenCV (CAP_FFMPEG); demais streams de rede (URL do IP
        # Webcam do celular etc.) usam o backend padrão. Não há dependência de VLC:
        # vlc_camera.py e pyav_camera.py (decode por hardware/NVDEC, desativado por ter
        # produzido frames corrompidos em teste real) não são importados por este módulo.
        if isinstance(source, int):
            self.cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
        elif isinstance(source, str) and source.startswith("rtsp://"):
            self.cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        else:
            self.cap = cv2.VideoCapture(source)

        if not self.is_opened():
            raise RuntimeError(f"Não foi possível abrir a câmera {source}")

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()
    
    def is_opened(self) -> bool:
        return self.cap.isOpened()