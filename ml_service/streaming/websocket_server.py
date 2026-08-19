import asyncio
import base64
import cv2
import json
import threading
import websockets

CONNECTED_CLIENTS = set()
_loop = None
_queue = None
_queue_lateral = None
_ready = threading.Event()

async def register(websocket):
    CONNECTED_CLIENTS.add(websocket)
    print(f"[WS] Cliente conectado. Total: {len(CONNECTED_CLIENTS)}")
    try:
        await websocket.wait_closed()
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        print(f"[WS] Cliente desconectado. Total: {len(CONNECTED_CLIENTS)}")

async def _sender_loop(queue_ref, msg_type):
    global CONNECTED_CLIENTS
    while True:
        frame = await queue_ref.get()
        if not CONNECTED_CLIENTS:
            continue

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        # Envia frame como JSON com type
        msg = json.dumps({"type": msg_type, "data": frame_b64})

        disconnected = set()
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
        CONNECTED_CLIENTS -= disconnected

def send_frame(frame):
    if _loop and _queue:
        def _put():
            if _queue.full():
                try:
                    _queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            _queue.put_nowait(frame)
        _loop.call_soon_threadsafe(_put)

def send_frame_lateral(frame):
    """Envia o frame da câmera lateral (2ª câmera da mesma unidade) como type 'frame_lateral'."""
    if _loop and _queue_lateral:
        def _put():
            if _queue_lateral.full():
                try:
                    _queue_lateral.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            _queue_lateral.put_nowait(frame)
        _loop.call_soon_threadsafe(_put)

def send_alert(label: str, confidence: float, timestamp: str):
    if not _loop or not CONNECTED_CLIENTS:
        return
    msg = json.dumps({
        "type": "alert",
        "label": label,
        "confidence": confidence,
        "timestamp": timestamp,
    })
    async def _broadcast():
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _loop)

async def _serve():
    global _queue, _queue_lateral
    _queue = asyncio.Queue(maxsize=2)
    _queue_lateral = asyncio.Queue(maxsize=2)
    asyncio.create_task(_sender_loop(_queue, "frame"))
    asyncio.create_task(_sender_loop(_queue_lateral, "frame_lateral"))

    async with websockets.serve(register, "0.0.0.0", 8765):
        print("[WS] Servidor WebSocket rodando em ws://localhost:8765")
        _ready.set()
        await asyncio.Future()

def send_detections(detections: list):
    if not _loop or not CONNECTED_CLIENTS:
        return
    msg = json.dumps({
        "type": "detections",
        "data": detections
    })
    async def _broadcast():
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _loop)


def send_pose(ergo_pessoas: list, source: str = "frontal"):
    if not _loop or not CONNECTED_CLIENTS:
        return
    msg = json.dumps({"type": "pose", "pessoas": ergo_pessoas, "source": source})
    async def _broadcast():
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _loop)

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