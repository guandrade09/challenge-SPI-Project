import cv2

from ml_service.inference.vlc_camera import VLCCamera

class Camera:
    def __init__(self, source=0):
        # CAP_DSHOW só se aplica a índices de dispositivo local (Windows).
        # Streams de rede (URL do IP Webcam do celular, RTSP, etc.) usam o backend padrão —
        # exceto RTSP, que usa VLC (ver vlc_camera.py: o FFmpeg do OpenCV rejeita o SETUP
        # de algumas câmeras, mesmo com URL/credenciais corretas — o VLC tem parser mais
        # tolerante). Existe também pyav_camera.py (decode por hardware/NVDEC, bem mais
        # leve de CPU) mas está desativado: produziu frames corrompidos em teste real,
        # precisa investigar antes de usar de novo (ver comentário no próprio arquivo).
        if isinstance(source, int):
            self.cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
        elif isinstance(source, str) and source.startswith("rtsp://"):
            # PyAV/NVDEC (pyav_camera.py) fica desativado por ora: reduz CPU mas produziu
            # frames com qualidade ruim/corrompida em teste real — provável falta do
            # extradata (SPS/PPS) no CodecContext manual do decoder de hardware. VLC é
            # mais lento de CPU mas visualmente correto — usar até resolver o NVDEC.
            self.cap = VLCCamera(source)
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