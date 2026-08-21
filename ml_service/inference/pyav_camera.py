
import threading
import time

import av

# Nome do decoder CUVID (NVDEC) da NVIDIA pra cada codec — bem mais leve de CPU que o
# decode em software (medido: ~25-50% de 1 núcleo por stream, contra ~150% em software).
_CUVID_MAP = {"hevc": "hevc_cuvid", "h264": "h264_cuvid"}


class PyAVCamera:
    """Captura frames de um RTSP usando PyAV, preferindo decodificação por hardware
    (NVDEC via *_cuvid) quando disponível — só cai pra decode em software se a GPU/driver
    não suportar o codec do stream. Levanta exceção no __init__ se não conseguir abrir o
    stream (quem chama decide o fallback, ex: VLCCamera pra câmeras que o FFmpeg rejeita)."""

    def __init__(self, url: str, open_timeout_s: float = 8.0):
        self._container = av.open(url, timeout=open_timeout_s)
        self._stream = self._container.streams.video[0]

        self._codec_ctx = None
        cuvid_name = _CUVID_MAP.get(self._stream.codec_context.name)
        if cuvid_name:
            try:
                self._codec_ctx = av.codec.CodecContext.create(cuvid_name, "r")
            except Exception:
                self._codec_ctx = None  # sem NVDEC pra esse codec — decode em software abaixo

        self._frame_lock = threading.Lock()
        self._frame = None
        self._has_frame = False
        self._stopped = False

        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

        deadline = time.time() + open_timeout_s
        while time.time() < deadline and not self._has_frame and not self._stopped:
            time.sleep(0.05)

        if not self._has_frame:
            self.release()
            raise RuntimeError(f"Não recebeu nenhum frame de {url} em {open_timeout_s}s")

    def _decode_hw(self):
        for packet in self._container.demux(self._stream):
            if self._stopped:
                return
            try:
                yield from self._codec_ctx.decode(packet)
            except Exception:
                continue  # pacote corrompido/incompleto — pula, não derruba o stream

    def _run(self):
        try:
            gen = self._decode_hw() if self._codec_ctx is not None else self._container.decode(self._stream)
            for frame in gen:
                if self._stopped:
                    break
                arr = frame.to_ndarray(format="bgr24")
                with self._frame_lock:
                    self._frame = arr
                    self._has_frame = True
        except Exception:
            pass
        finally:
            self._stopped = True

    def read(self):
        if not self._has_frame:
            return False, None
        with self._frame_lock:
            return True, self._frame.copy()

    def isOpened(self) -> bool:
        return self._has_frame and not (self._stopped and self._frame is None)

    def set(self, *_args, **_kwargs):
        pass  # resolução já vem do stream nativo da câmera

    def release(self):
        self._stopped = True
        try:
            self._container.close()
        except Exception:
            pass
