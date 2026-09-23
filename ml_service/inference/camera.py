import os

import cv2

# Força RTSP sobre TCP no FFmpeg (usado pelo cv2.VideoCapture). Sem isso, essas câmeras
# (Yoosee/HIipCamera) recusam o SETUP com "Nonmatching transport in server reply" quando
# o FFmpeg tenta UDP primeiro — forçar TCP evita esse mismatch de transporte. Precisa ser
# setado antes de qualquer VideoCapture ser aberto.
os.environ.setdefault(
    "OPENCV_FFMPEG_CAPTURE_OPTIONS",
    "rtsp_transport;tcp|stimeout;8000000"
    "|fflags;nobuffer|flags;low_delay|max_delay;0",
)


class Camera:
    def __init__(self, source=0):
        # CAP_DSHOW só se aplica a índices de dispositivo local (Windows).
        # RTSP e HTTP/MJPEG usam OpenCV/FFmpeg direto (rtsp_transport=tcp forçado no topo
        # do módulo evita o "Nonmatching transport in server reply"). Existe também
        # pyav_camera.py (decode por hardware/NVDEC, bem mais leve de CPU) mas está
        # desativado: produziu frames corrompidos em teste real, precisa investigar antes
        # de usar de novo (ver comentário no próprio arquivo) — e não é importado por
        # este módulo. vlc_camera.py foi removido do fluxo por causar delay alto.
        if isinstance(source, int):
            self.cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
        elif isinstance(source, str) and source.lower().startswith("rtsp://"):
            # CAP_PROP_BUFFERSIZE não é aceito na lista de parâmetros do .open() do
            # backend FFmpeg (só um subconjunto de props é permitido ali, ex. timeouts) —
            # passá-lo junto faz o open() inteiro falhar com "unsupported parameters".
            # Por isso é setado depois, via cap.set(), e não no array de abertura.
            # CAP_PROP_HW_ACCELERATION;ANY pede decode por hardware (NVDEC/DXVA) ao
            # FFmpeg quando disponível. Diferente do pyav_camera.py (que montava o
            # CodecContext manualmente e tinha bug de extradata faltando), aqui o
            # FFmpeg abre o stream do jeito normal e já cuida do extradata sozinho — se
            # o hardware/driver não suportar, ele cai pra software sem erro, então é
            # seguro deixar ligado por padrão.
            self.cap = cv2.VideoCapture(
                source,
                cv2.CAP_FFMPEG,
                [cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 8000,
                 cv2.CAP_PROP_READ_TIMEOUT_MSEC, 8000,
                 cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY],
            )
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
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
            # libera o handle antes de falhar — com reconexão automática, cada tentativa
            # falha criaria um handle novo sem liberar o anterior
            try:
                self.cap.release()
            except Exception:
                pass
            raise RuntimeError(f"Não foi possível abrir a câmera {source}")

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()

    def is_opened(self) -> bool:
        return self.cap.isOpened()
