import asyncio
import cv2
import json
import threading
import websockets

CONNECTED_CLIENTS = set()
_loop = None
_ready = threading.Event()
_pose_cache: dict[str, str] = {}   # mantido só pra compatibilidade, replay removido


async def register(websocket):
    CONNECTED_CLIENTS.add(websocket)
    print(f"[WS] Cliente conectado. Total: {len(CONNECTED_CLIENTS)}")
    try:
        await websocket.wait_closed()
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        print(f"[WS] Cliente desconectado. Total: {len(CONNECTED_CLIENTS)}")


def _broadcast_threadsafe(msg: str):
    """Envia msg (JSON str) para todos os clientes conectados, de qualquer thread."""
    if not _loop or not CONNECTED_CLIENTS:
        return
    async def _do():
        disconnected = set()
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                disconnected.add(client)
        CONNECTED_CLIENTS.difference_update(disconnected)
    asyncio.run_coroutine_threadsafe(_do(), _loop)


def _broadcast_binary_threadsafe(data: bytes):
    """Envia frame binário para todos os clientes conectados, de qualquer thread."""
    if not _loop or not CONNECTED_CLIENTS:
        return
    async def _do():
        disconnected = set()
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(data)
            except Exception:
                disconnected.add(client)
        CONNECTED_CLIENTS.difference_update(disconnected)
    asyncio.run_coroutine_threadsafe(_do(), _loop)


def send_tagged_frame(frame, setor: str = "", source: str = "frontal"):
    """Codifica o frame em JPEG e transmite como binário (header JSON + \\n + bytes JPEG)."""
    if not _loop or not CONNECTED_CLIENTS:
        return
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 45])
    jpeg_bytes = buffer.tobytes()
    header = json.dumps({"type": "frame", "setor": setor, "source": source}).encode('utf-8')
    _broadcast_binary_threadsafe(header + b'\n' + jpeg_bytes)


# Compat: mantém assinatura antiga (sem setor) — usada por código legado/outros módulos
def send_frame(frame):
    send_tagged_frame(frame, setor="", source="frontal")


def send_frame_lateral(frame):
    send_tagged_frame(frame, setor="", source="lateral")


def send_alert(label: str, confidence: float, timestamp: str, setor: str = ""):
    msg = json.dumps({
        "type":       "alert",
        "label":      label,
        "confidence": confidence,
        "timestamp":  timestamp,
        "setor":      setor,
    })
    _broadcast_threadsafe(msg)


def send_detections(detections: list, setor: str = ""):
    msg = json.dumps({"type": "detections", "data": detections, "setor": setor})
    _broadcast_threadsafe(msg)


def send_pose(ergo_pessoas: list, source: str = "frontal", setor: str = ""):
    msg = json.dumps({"type": "pose", "pessoas": ergo_pessoas, "source": source, "setor": setor})
    cache_key = f"{setor}:{source}"
    _pose_cache[cache_key] = msg
    _broadcast_threadsafe(msg)


def send_zone(camera_id: str, pontos: list, setor: str = ""):
    """Envia o polígono da zona de risco para o frontend desenhar no canvas."""
    msg = json.dumps({"type": "zone", "camera_id": camera_id, "pontos": pontos, "setor": setor})
    _pose_cache[f"zone:{setor}:{camera_id}"] = msg  # cacheia para reconexões
    _broadcast_threadsafe(msg)


async def _serve():
    async with websockets.serve(register, "0.0.0.0", 8765):
        print("[WS] Servidor WebSocket rodando em ws://localhost:8765")
        _ready.set()
        await asyncio.Future()


def start_server_in_thread():
    global _loop
    _loop = asyncio.new_event_loop()

    def run():
        asyncio.set_event_loop(_loop)
        _loop.run_until_complete(_serve())

    t = threading.Thread(target=run, daemon=True)
    t.start()
    _ready.wait()
    print("[WS] pronto para receber frames")
    return _loop
