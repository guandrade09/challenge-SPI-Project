import ctypes
import threading
import time

import numpy as np
import vlc

# vlc.VideoLockCb/VideoUnlockCb/VideoDisplayCb (do módulo python-vlc) são só
# marcadores de tipo usados na declaração do argtypes do ctypes — não são
# decorators utilizáveis. Os protótipos reais de callback do libvlc são estes:
_LockCb = ctypes.CFUNCTYPE(ctypes.c_void_p, ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p))
_UnlockCb = ctypes.CFUNCTYPE(None, ctypes.c_void_p, ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p))
_DisplayCb = ctypes.CFUNCTYPE(None, ctypes.c_void_p, ctypes.c_void_p)


class VLCCamera:
    """Captura frames de um stream RTSP usando o libvlc em vez do FFmpeg do OpenCV.

    Existem câmeras (ex: clones Yoosee/HIipCamera) cujo servidor RTSP responde de um
    jeito que o parser do FFmpeg rejeita ("Nonmatching transport in server reply"),
    mesmo com credenciais/URL corretas — confirmado testando o handshake RTSP na mão.
    O VLC tem um parser mais tolerante e abre essas câmeras sem problema, então
    usamos libvlc só pra decodificar e entregamos os frames em BGR (numpy), pra o
    resto do pipeline (que espera a mesma interface do cv2.VideoCapture) nem notar
    a diferença.
    """

    def __init__(self, url: str, width: int = 640, height: int = 480, open_timeout_s: float = 8.0):
        self.width = width
        self.height = height
        self._frame_lock = threading.Lock()
        self._frame = None
        self._has_frame = False

        # RV32 = BGRA "empacotado", 4 bytes/pixel — já sai na ordem que o cv2/numpy espera
        # (só precisa descartar o canal alfa).
        self._buf = (ctypes.c_ubyte * (width * height * 4))()
        self._buf_p = ctypes.cast(self._buf, ctypes.c_void_p)

        # avcodec-hw=any: decodifica H.264/H.265 na GPU (DXVA2/D3D11VA no Windows) em vez
        # de gastar CPU — com 2 streams RTSP decodificando em software, o CPU desse note
        # (i5, 8GB RAM) satura fácil e trava o resto (browser, inferência).
        self._instance = vlc.Instance("--quiet", "--no-audio", "--avcodec-hw=any")
        self._player = self._instance.media_player_new()
        media = self._instance.media_new(url)
        self._player.set_media(media)
        self._player.video_set_format("RV32", width, height, width * 4)

        # Precisa manter referência aos CFUNCTYPE — se forem coletados pelo GC o
        # libvlc chama um ponteiro morto e derruba o processo.
        self._lock_cb = _LockCb(self._on_lock)
        self._unlock_cb = _UnlockCb(self._on_unlock)
        self._display_cb = _DisplayCb(self._on_display)
        self._player.video_set_callbacks(self._lock_cb, self._unlock_cb, self._display_cb, None)

        self._player.play()

        deadline = time.time() + open_timeout_s
        while time.time() < deadline and not self._has_frame:
            state = self._player.get_state()
            if state in (vlc.State.Error, vlc.State.Ended):
                break
            time.sleep(0.1)

    def _on_lock(self, opaque, planes):
        planes[0] = self._buf_p
        return None

    def _on_unlock(self, opaque, picture, planes):
        arr = np.ctypeslib.as_array(self._buf).reshape((self.height, self.width, 4))
        with self._frame_lock:
            self._frame = arr[:, :, :3].copy()  # BGRA -> BGR
            self._has_frame = True

    def _on_display(self, opaque, picture):
        pass

    def read(self):
        if not self._has_frame:
            return False, None
        with self._frame_lock:
            return True, self._frame.copy()

    def isOpened(self) -> bool:
        if self._has_frame:
            return True
        return self._player.get_state() not in (vlc.State.Error, vlc.State.Ended, vlc.State.Stopped)

    def set(self, *_args, **_kwargs):
        # No-op: resolução já é fixada no video_set_format, na criação.
        pass

    def release(self):
        try:
            self._player.stop()
        except Exception:
            pass
