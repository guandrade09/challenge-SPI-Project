import cv2

from ml_service.inference.vlc_camera import VLCCamera

class Camera:
    def __init__(self, source=0):
        # CAP_DSHOW só se aplica a índices de dispositivo local (Windows).
        # Streams HTTP/MJPEG usam OpenCV/FFmpeg; RTSP usa VLC (ver vlc_camera.py:
        # o FFmpeg do OpenCV rejeita o SETUP
        # de algumas câmeras, mesmo com URL/credenciais corretas — o VLC tem parser mais
        # tolerante). Existe também pyav_camera.py (decode por hardware/NVDEC, bem mais
        # leve de CPU) mas está desativado: produziu frames corrompidos em teste real,
        # precisa investigar antes de usar de novo (ver comentário no próprio arquivo).
        if isinstance(source, int):
            self.cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
        elif isinstance(source, str) and source.lower().startswith("rtsp://"):
            # PyAV/NVDEC (pyav_camera.py) fica desativado por ora: reduz CPU mas produziu
            # frames com qualidade ruim/corrompida em teste real — provável falta do
            # extradata (SPS/PPS) no CodecContext manual do decoder de hardware. VLC é
            # mais lento de CPU mas visualmente correto — usar até resolver o NVDEC.
            self.cap = VLCCamera(source)
        elif isinstance(source, str) and source.lower().startswith(("http://", "https://")):
            # Streams HTTP/MJPEG (ex.: IP Webcam /video) são suportados diretamente
            # pelo OpenCV. O VLC pode entrar em estado Playing sem entregar frames.
            self.cap = cv2.VideoCapture(
                source,
                cv2.CAP_FFMPEG,
                [cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 8000,
                 cv2.CAP_PROP_READ_TIMEOUT_MSEC, 8000],
            )
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
