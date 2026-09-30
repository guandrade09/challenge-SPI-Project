import asyncio
import cv2
import json
import threading
import time
import inspect
import websockets

_loop = None
_ready = threading.Event()
_pose_cache: dict[str, str] = {}
_frame_sequences: dict[str, int] = {}
_message_handler = None
_server_error = None

CONNECTED_CLIENTS = set()
CONNECTED_SESSIONS = set()


class ClientSession:
    """Gerencia a transmissão para um cliente conectado.

    Aplica a política DROP-OLDEST por stream:
    - O frame mais recente de cada câmera/setor sobrescreve qualquer frame anterior
      ainda não enviado daquela mesma câmera.
    - O loop de escrita distribui o envio de forma justa (round-robin) entre as câmeras.
    - A latência nunca se acumula: o cliente SEMPRE recebe o frame mais fresco.
    """

    def __init__(self, ws):
        self.ws = ws
        self.pending_frames: dict[str, bytes] = {}
        self.msg_queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self.notify_event = asyncio.Event()
        self.active = True
        self.include_frames = True
        self._key_index = 0

    def queue_frame(self, key: str, data: bytes):
        """Atualiza o frame da câmera. Sobrescreve frame anterior se não enviado."""
        self.pending_frames[key] = data
        self.notify_event.set()

    def queue_msg(self, msg: str):
        """Enfileira mensagem de controle (JSON). Descarta mais antiga se fila lotar."""
        if self.msg_queue.full():
            try:
                self.msg_queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            self.msg_queue.put_nowait(msg)
            self.notify_event.set()
        except asyncio.QueueFull:
            pass

    async def run_writer(self):
        """Task dedicada de envio para este socket."""
        try:
            while self.active:
                # Drena mensagens de controle (JSON) prioritariamente
                while not self.msg_queue.empty():
                    msg = self.msg_queue.get_nowait()
                    await self.ws.send(msg)

                # Se houver frames pendentes, envia um em round-robin entre as câmeras
                if self.pending_frames:
                    keys = list(self.pending_frames.keys())
                    if keys:
                        self._key_index = (self._key_index + 1) % len(keys)
                        chosen_key = keys[self._key_index]
                        frame_data = self.pending_frames.pop(chosen_key, None)
                        if frame_data:
                            await self.ws.send(frame_data)

                # Se não há mais nada pendente, aguarda notificação
                if self.msg_queue.empty() and not self.pending_frames:
                    self.notify_event.clear()
                    if self.msg_queue.empty() and not self.pending_frames:
                        await self.notify_event.wait()
                else:
                    # Dá oportunidade para o event loop processar I/O
                    await asyncio.sleep(0)
        except Exception:
            pass
        finally:
            self.active = False


async def register(websocket):
    session = ClientSession(websocket)
    CONNECTED_SESSIONS.add(session)
    CONNECTED_CLIENTS.add(websocket)
    print(f"[WS] Cliente conectado. Total: {len(CONNECTED_SESSIONS)}")

    writer_task = asyncio.create_task(session.run_writer())

    # Envia estados cacheados (zonas, poses) para o novo cliente
    for cached_msg in _pose_cache.values():
        session.queue_msg(cached_msg)

    try:
        async for raw_message in websocket:
            if not isinstance(raw_message, str):
                continue
            payload = None
            try:
                payload = json.loads(raw_message)
                if isinstance(payload, dict) and payload.get("type") == "set_stream_mode":
                    session.include_frames = bool(payload.get("frames", True))
                    if not session.include_frames:
                        session.pending_frames.clear()
                    continue
                if _message_handler is None:
                    continue
                response = _message_handler(payload)
                if inspect.isawaitable(response):
                    response = await response
                if response is not None:
                    session.queue_msg(json.dumps(response))
            except Exception as exc:
                session.queue_msg(json.dumps({
                    "type": "command_error",
                    "request_id": payload.get("requestId") if isinstance(payload, dict) else None,
                    "error": str(exc),
                }))
    except Exception:
        pass
    finally:
        session.active = False
        writer_task.cancel()
        CONNECTED_SESSIONS.discard(session)
        CONNECTED_CLIENTS.discard(websocket)
        print(f"[WS] Cliente desconectado. Total: {len(CONNECTED_SESSIONS)}")


def _dispatch_frame(key: str, data: bytes):
    for session in list(CONNECTED_SESSIONS):
        if session.active and session.include_frames:
            session.queue_frame(key, data)


def _dispatch_json(msg: str):
    for session in list(CONNECTED_SESSIONS):
        if session.active:
            session.queue_msg(msg)


def _broadcast_threadsafe(msg: str):
    """Envia msg (JSON str) para todos os clientes conectados, de qualquer thread."""
    if not _loop or not CONNECTED_SESSIONS:
        return
    _loop.call_soon_threadsafe(_dispatch_json, msg)


def _broadcast_binary_threadsafe(data: bytes, key: str = "default:frontal"):
    """Envia frame binário para todos os clientes conectados, de qualquer thread."""
    if not _loop or not CONNECTED_SESSIONS:
        return
    _loop.call_soon_threadsafe(_dispatch_frame, key, data)


def set_message_handler(handler):
    """Registra o handler dos comandos recebidos do frontend."""
    global _message_handler
    _message_handler = handler


def send_tagged_frame(frame, setor: str = "", source: str = "frontal", camera_id=None):
    """Codifica o frame em JPEG e transmite como binário com descarte de frames atrasados."""
    if not _loop or not CONNECTED_SESSIONS:
        return
    if isinstance(frame, bytes):
        jpeg_bytes = frame
    else:
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 45])
        jpeg_bytes = buffer.tobytes()

    source = source or "frontal"
    key = f"camera:{camera_id}" if camera_id is not None else f"{setor}:{source}"
    sequence = _frame_sequences.get(key, 0) + 1
    _frame_sequences[key] = sequence
    height = None if isinstance(frame, bytes) else int(frame.shape[0])
    width = None if isinstance(frame, bytes) else int(frame.shape[1])
    header = json.dumps({
        "type": "frame", "camera_id": camera_id, "setor": setor,
        "source": source, "sequence": sequence, "captured_at": time.time(),
        "width": width, "height": height,
    }).encode('utf-8')
    data = header + b'\n' + jpeg_bytes
    _broadcast_binary_threadsafe(data, key=key)


def send_frame(frame):
    send_tagged_frame(frame, setor="", source="frontal")


def send_frame_lateral(frame):
    send_tagged_frame(frame, setor="", source="lateral")


def send_alert(label: str, confidence: float, timestamp: str, setor: str = "",
               camera_id=None, source: str | None = None):
    msg = json.dumps({
        "type":       "alert",
        "label":      label,
        "confidence": confidence,
        "timestamp":  timestamp,
        "setor":      setor,
        "camera_id":  camera_id,
        "source":     source,
    })
    _broadcast_threadsafe(msg)


def send_detections(detections: list, setor: str = "", source: str = "frontal", camera_id=None):
    msg = json.dumps({
        "type": "detections", "data": detections, "setor": setor,
        "source": source or "frontal", "camera_id": camera_id,
    })
    _broadcast_threadsafe(msg)


def send_pose(ergo_pessoas: list, source: str = "frontal", setor: str = ""):
    msg = json.dumps({"type": "pose", "pessoas": ergo_pessoas, "source": source, "setor": setor})
    cache_key = f"{setor}:{source}"
    _pose_cache[cache_key] = msg
    _broadcast_threadsafe(msg)


def send_zone(camera_id: str, pontos: list, setor: str = ""):
    """Envia o polígono da zona de risco para o frontend desenhar no canvas."""
    msg = json.dumps({"type": "zone", "camera_id": camera_id, "pontos": pontos, "setor": setor})
    _pose_cache[f"zone:{setor}:{camera_id}"] = msg
    _broadcast_threadsafe(msg)


def send_verdict(verdict_dict: dict, setor: str = ""):
    """Envia veredicto formatado para os clientes conectados."""
    payload = {"type": "verdict", "setor": setor, **verdict_dict}
    _broadcast_threadsafe(json.dumps(payload))


def send_metrics(metrics_dict: dict, setor: str = ""):
    """Envia métricas formatadas para os clientes conectados."""
    payload = {"type": "metrics", "setor": setor, **metrics_dict}
    _broadcast_threadsafe(json.dumps(payload))


def send_queda(pessoas: list, timestamp: str, setor: str = "", camera_id=None, source: str = "frontal"):
    """Envia evento de queda."""
    payload = {
        "type": "queda", "event_id": f"{camera_id}:{timestamp}",
        "timestamp": timestamp, "setor": setor, "pessoas": pessoas,
        "camera_id": camera_id, "source": source or "frontal",
    }
    _broadcast_threadsafe(json.dumps(payload))


def send_stream_status(camera_id, setor: str, source: str, status: str, reason: str | None = None):
    payload = {
        "type": "stream_status", "camera_id": camera_id, "setor": setor,
        "source": source or "frontal", "status": status,
        "reason": reason, "timestamp": time.time(),
    }
    _broadcast_threadsafe(json.dumps(payload))


async def _serve():
    async with websockets.serve(register, "0.0.0.0", 8765, ping_interval=20, ping_timeout=20):
        print("[WS] Servidor WebSocket rodando em ws://localhost:8765")
        _ready.set()
        await asyncio.Future()


def start_server_in_thread():
    global _loop, _server_error
    _ready.clear()
    _server_error = None
    _loop = asyncio.new_event_loop()

    def run():
        asyncio.set_event_loop(_loop)
        global _server_error
        try:
            _loop.run_until_complete(_serve())
        except Exception as exc:
            _server_error = exc
            _ready.set()

    t = threading.Thread(target=run, daemon=True)
    t.start()
    if not _ready.wait(timeout=10):
        raise RuntimeError("Timeout ao iniciar o servidor WebSocket")
    if _server_error is not None:
        raise RuntimeError(f"Falha ao iniciar o servidor WebSocket: {_server_error}") from _server_error
    print("[WS] pronto para receber frames")
    return _loop
