import asyncio
import base64
import cv2
import threading
import websockets

CONNECTED_CLIENTS = set()
_loop = None
_queue = None
_ready = threading.Event()

async def register(websocket):
    CONNECTED_CLIENTS.add(websocket)
    print(f"[WS] Cliente conectado. Total: {len(CONNECTED_CLIENTS)}")
    try:
        await websocket.wait_closed()
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        print(f"[WS] Cliente desconectado. Total: {len(CONNECTED_CLIENTS)}")

async def _sender_loop():
    global CONNECTED_CLIENTS 
    
    while True:
        frame = await _queue.get()
        if not CONNECTED_CLIENTS:
            continue

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        disconnected = set()
        for client in list(CONNECTED_CLIENTS):
            try:
                await client.send(frame_b64)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
        CONNECTED_CLIENTS -= disconnected

def send_frame(frame):
    if _loop and _queue:
        def _put():
            if _queue.full():
                try:
                    _queue.get_nowait()  # descarta frame antigo
                except asyncio.QueueEmpty:
                    pass
            _queue.put_nowait(frame)
        _loop.call_soon_threadsafe(_put)

async def _serve():
    global _queue
    _queue = asyncio.Queue(maxsize=2)
    asyncio.create_task(_sender_loop())

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