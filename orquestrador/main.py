"""
Orquestrador — Pipeline Multi-Setor de Visão Computacional
============================================================
Cameras são agrupadas por `setor`. Cameras do mesmo setor compartilham o
pipeline de análise (EPI frontal + pose lateral + zona). Setores diferentes
rodam pipelines independentes mas compartilham os modelos YOLO via lock de
inferência GPU.

Adição de câmeras no frontend é detectada automaticamente (a cada 30 s) e
inicia um novo pipeline sem reiniciar o orquestrador.
"""

import sys
import os
import asyncio
import queue
import threading
import time
import base64
import json
import cv2
import requests
from datetime import datetime
from dataclasses import dataclass, field

# ── Caminhos ───────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "ml_ergonomia"))
sys.path.insert(0, os.path.join(ROOT, "ml_zona_critica"))

# Precisa rodar antes de importar ultralytics/torch — ver cpu_affinity.py
import cpu_affinity
_ORCH_CORES = cpu_affinity.apply()
cv2.setNumThreads(len(_ORCH_CORES))

from thread_metrics import ml_thread_metrics_service

from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from ml_service.inference.model_loader import load_yolo_with_engine_fallback
from ml_service.streaming.websocket_server import (
    send_tagged_frame, send_alert, send_pose, send_detections, send_zone,
    send_verdict, send_metrics, send_queda, send_stream_status,
    set_message_handler, start_server_in_thread,
)
import ml_service.streaming.websocket_server as _ws
from core.entities import Detection
from pose_analyzer import PoseAnalyzer
from zone_checker import ZoneChecker
import config_server
from config_server import epi_prefixes_ativos, ergonomia_ativa

# ── Configuração ───────────────────────────────────────────────────────────────
BACKEND_URL        = "http://localhost:3000/api/detections"
BACKEND_ZONAS_URL  = "http://localhost:3000/api/zonas"
CAMERAS_API_URL    = "http://localhost:3000/api/cameras"
CONFIG_SERVER_PORT = 5050

# Intervalo de verificação: novos setores / câmeras adicionadas no frontend
SECTOR_CHECK_INTERVAL_S  = 30
RECHECK_CAMERA_INTERVAL_S = 15

# Frames consecutivos necessários para confirmar cada tipo de risco
FRAMES_EPI   = 10
FRAMES_ERGO  = 8
FRAMES_ZONA  = 3
COOLDOWN_EPI  = 60
COOLDOWN_ERGO = 60
COOLDOWN_ZONA = 30

REBA_RISCO_MINIMO = 4
POSE_CONF_MINIMO  = 0.5
MODEL_IMGSZ       = 320

CAMERA_DUAL_MODE = os.environ.get("CAMERA_DUAL_MODE", "independente")


# ── Verdict ────────────────────────────────────────────────────────────────────
@dataclass
class Verdict:
    status:     str
    reasons:    list[str]
    confidence: float
    sources:    list[str]
    timestamp:  str = field(default_factory=lambda: datetime.now().isoformat())


# ── Debouncer simples ──────────────────────────────────────────────────────────
class SimpleDebouncer:
    def __init__(self, required_frames: int, cooldown_frames: int):
        self._counter  = 0
        self._cooldown = 0
        self.required  = required_frames
        self.cooldown  = cooldown_frames

    def update(self, is_risk: bool) -> bool:
        if self._cooldown > 0:
            self._cooldown -= 1
            return False
        if is_risk:
            self._counter += 1
            if self._counter >= self.required:
                self._counter  = 0
                self._cooldown = self.cooldown
                return True
        else:
            self._counter = 0
        return False


# ── Helpers REBA ───────────────────────────────────────────────────────────────
def _pessoa_em_risco_ergo(p: dict) -> bool:
    return p.get("reba_score", 1) >= REBA_RISCO_MINIMO

def _reba_reason(p: dict) -> str:
    return f"ergonomia_reba_{p.get('reba_level', 'DESCONHECIDO').lower()}_{p.get('reba_score', 0)}"

def _pose_completude(pessoa: dict) -> int:
    return len(pessoa.get("angulos", {}))

def _merge_pose_readings(pessoas_a: list[dict], pessoas_b: list[dict]) -> list[dict]:
    if not pessoas_a:
        return pessoas_b
    if not pessoas_b:
        return pessoas_a
    merged = []
    for i in range(max(len(pessoas_a), len(pessoas_b))):
        if i < len(pessoas_a) and i < len(pessoas_b):
            melhor = (
                pessoas_a[i] if _pose_completude(pessoas_a[i]) >= _pose_completude(pessoas_b[i])
                else pessoas_b[i]
            )
            merged.append(melhor)
        elif i < len(pessoas_a):
            merged.append(pessoas_a[i])
        else:
            merged.append(pessoas_b[i])
    return merged


# ── Parse EPI ─────────────────────────────────────────────────────────────────
def _parse_epi(raw_results, names: dict) -> list[Detection]:
    detections = []
    for result in raw_results:
        for box in result.boxes:
            label      = names[int(box.cls[0])]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            detections.append(Detection(
                label=label, confidence=confidence,
                x1=x1, y1=y1, x2=x2, y2=y2,
            ))
    return detections


# ── Aggregator ─────────────────────────────────────────────────────────────────
def _aggregate(
    epi_confirmed: list[Detection],
    ergo_pessoas:  list[dict],
    zona_pessoas:  list[dict],
    epi_dets:      list[Detection] | None = None,
) -> Verdict:
    reasons     = []
    confidences = []
    sources     = []

    all_epi_labels = {d.label for d in (epi_dets or epi_confirmed)}

    for d in epi_confirmed:
        reasons.append(d.label)
        confidences.append(float(d.confidence))
        if "epi" not in sources:
            sources.append("epi")

    for p in ergo_pessoas:
        if _pessoa_em_risco_ergo(p):
            reasons.append(_reba_reason(p))
            confidences.append(p["confianca_deteccao"])
            if "ergonomia" not in sources:
                sources.append("ergonomia")

    for p in zona_pessoas:
        if p["invadiu"]:
            reasons.append("zona_perigo")
            confidences.append(1.0)
            if "zona" not in sources:
                sources.append("zona")
            epis_certo = p.get("epis_certo_labels", [])
            epis_obrig = p.get("epis_obrigatorios", [])
            for epi_id, epi_label in zip(epis_obrig, epis_certo):
                if epi_label not in all_epi_labels:
                    reasons.append(f"zona_epi_ausente_{epi_id}")
                    confidences.append(1.0)

    if not reasons:
        return Verdict(status="MONITORANDO", reasons=[], confidence=0.0, sources=[])

    avg_conf   = round(sum(confidences) / len(confidences), 4)
    is_critico = any(p.get("reba_level") == "ALTO" for p in ergo_pessoas) or any(
        r == "zona_perigo" for r in reasons
    )

    if len(sources) > 1:
        status = "ALERTA_MULTIPLO"
    elif is_critico:
        status = "ALERTA_CRITICO"
    else:
        status = "ALERTA"

    return Verdict(status=status, reasons=reasons, confidence=avg_conf, sources=sources)


# ── WebSocket: envia veredicto e métricas ─────────────────────────────────────
def _send_verdict(verdict: Verdict, setor: str = ""):
    send_verdict({
        "status":     verdict.status,
        "reasons":    verdict.reasons,
        "confidence": verdict.confidence,
        "sources":    verdict.sources,
        "timestamp":  verdict.timestamp,
    }, setor=setor)


def _send_metrics(lat_total_ms, lat_epi_ms, lat_pose_ms, pck_pose, conf_media_epi, setor: str = ""):
    send_metrics({
        "latencia_total_ms":  round(lat_total_ms, 1),
        "latencia_epi_ms":    round(lat_epi_ms, 1),
        "latencia_pose_ms":   round(lat_pose_ms, 1),
        "pck_pose":           pck_pose,
        "conf_media_epi":     conf_media_epi,
    }, setor=setor)


def _calc_pck(results, threshold: float = 0.5) -> float | None:
    if not results or results[0].keypoints is None:
        return None
    kps = results[0].keypoints.data
    if kps.numel() == 0:
        return None
    return round(float((kps[:, :, 2] > threshold).float().mean()), 4)


# ── Beep ───────────────────────────────────────────────────────────────────────
def _beep():
    try:
        import winsound
        winsound.Beep(1000, 300)
    except ImportError:
        print("\a", end="", flush=True)


# ── Worker de POST HTTP ────────────────────────────────────────────────────────
_post_queue: queue.Queue = queue.Queue()

def _post_worker():
    while True:
        payload = _post_queue.get()
        try:
            last_error = None
            for attempt in range(1, 4):
                try:
                    response = requests.post(BACKEND_URL, json=payload, timeout=5)
                    response.raise_for_status()
                    print(
                        f"[POST] incidente salvo | label={payload.get('label')} | "
                        f"camera_id={payload.get('camera_id')} | setor={payload.get('setor')}"
                    )
                    last_error = None
                    break
                except Exception as exc:
                    last_error = exc
                    if attempt < 3:
                        time.sleep(attempt)
            if last_error is not None:
                print(
                    f"[POST] incidente não salvo após 3 tentativas | "
                    f"label={payload.get('label')} | erro={last_error}"
                )
        finally:
            _post_queue.task_done()


# ── Zona ───────────────────────────────────────────────────────────────────────
def _fetch_zona_from_backend(camera_id: str) -> dict | None:
    try:
        r = requests.get(f"{BACKEND_ZONAS_URL}/{camera_id}", timeout=2)
        if r.status_code == 200:
            data = r.json()
            print(f"[ZONA] Carregada do backend: '{data.get('nome')}'")
            return data
    except Exception:
        pass
    return None

def _load_zona(zone_checker, camera_id: str, setor: str = "", allow_local: bool = False) -> bool:
    config = _fetch_zona_from_backend(camera_id)
    if config is None and allow_local:
        config = config_server.load_config()
        if config:
            print(f"[ZONA] Carregada do arquivo local: '{config.get('nome')}'")
    if config is None:
        print(f"[ZONA] Nenhuma zona para {camera_id}")
        return False
    try:
        zone_checker.configure(
            camera_id,
            config["nome"],
            config["pontos"],
            epis_obrigatorios=config.get("epis_obrigatorios", []),
            epis_certo_labels=config.get("epis_certo_labels", []),
        )
        send_zone(camera_id, config["pontos"], setor=setor)
        return True
    except Exception as e:
        print(f"[ZONA] Erro ao aplicar config: {e}")
        return False


_camera_frame_shapes: dict[str, tuple[int, int]] = {}
_camera_retry_events: dict[str, threading.Event] = {}
_camera_retry_lock = threading.Lock()


def _camera_runtime_key(camera_id, setor: str, source: str) -> str:
    return f"{camera_id if camera_id is not None else setor}:{source or 'frontal'}"


def _get_camera_retry_event(camera_id, setor: str, source: str) -> threading.Event:
    key = _camera_runtime_key(camera_id, setor, source)
    with _camera_retry_lock:
        return _camera_retry_events.setdefault(key, threading.Event())


def _make_ws_message_handler(zone_checker):
    async def handle(payload: dict):
        message_type = payload.get("type")
        if message_type == "set_epi_config":
            request_id = payload.get("requestId")
            raw_camera_id = payload.get("cameraId")
            if raw_camera_id is None:
                raise ValueError("cameraId é obrigatório")
            setor = payload.get("setor") or ""
            epis = payload.get("epis")
            cfg = await asyncio.to_thread(
                config_server.set_analise_config, setor, epis, raw_camera_id
            )
            return {
                "type": "epi_config_updated", "ok": True,
                "request_id": request_id, "camera_id": raw_camera_id,
                "setor": setor, **cfg,
            }
        if message_type == "reconnect_stream":
            request_id = payload.get("requestId")
            raw_camera_id = payload.get("cameraId")
            if raw_camera_id is None:
                raise ValueError("cameraId é obrigatório")
            setor = payload.get("setor") or ""
            source = payload.get("source") or "frontal"
            _get_camera_retry_event(raw_camera_id, setor, source).set()
            send_stream_status(raw_camera_id, setor, source, "reconnecting", "solicitado_pelo_usuario")
            return {
                "type": "stream_reconnect_requested", "ok": True,
                "request_id": request_id, "camera_id": raw_camera_id,
                "setor": setor, "source": source,
            }
        if message_type != "set_risk_area":
            return None
        request_id = payload.get("requestId")
        raw_camera_id = payload.get("cameraId")
        if raw_camera_id is None:
            raise ValueError("cameraId é obrigatório")
        camera_id = str(raw_camera_id)
        zone_camera_id = camera_id if camera_id.startswith("cam_") else f"cam_{camera_id}"
        setor = payload.get("setor") or ""
        risk_area = payload.get("riskArea")

        if risk_area is None:
            zone_checker.delete(zone_camera_id)
            try:
                await asyncio.to_thread(
                    requests.delete, f"{BACKEND_ZONAS_URL}/{zone_camera_id}", timeout=2,
                )
            except Exception as exc:
                print(f"[ZONA] Aviso ao remover persistência: {exc}")
            send_zone(zone_camera_id, [], setor=setor)
            return {"type": "zone_updated", "ok": True, "removed": True,
                    "request_id": request_id, "camera_id": zone_camera_id, "setor": setor}

        shape = _camera_frame_shapes.get(camera_id)
        if shape is None:
            raise ValueError("a câmera ainda não forneceu dimensões de frame")
        width, height = shape
        try:
            x = float(risk_area["x"]); y = float(risk_area["y"])
            box_width = float(risk_area["width"]); box_height = float(risk_area["height"])
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError("riskArea inválida") from exc
        if box_width <= 0 or box_height <= 0 or min(x, y) < 0 or x + box_width > 100 or y + box_height > 100:
            raise ValueError("riskArea deve estar dentro de 0..100%")

        x1, y1 = x * width / 100, y * height / 100
        x2, y2 = (x + box_width) * width / 100, (y + box_height) * height / 100
        points = [{"x": x1, "y": y1}, {"x": x2, "y": y1},
                  {"x": x2, "y": y2}, {"x": x1, "y": y2}]
        name = f"Área de risco - {setor or camera_id}"
        response = await asyncio.to_thread(
            requests.post, BACKEND_ZONAS_URL,
            json={"camera_id": zone_camera_id, "nome": name, "pontos": points},
            timeout=2,
        )
        response.raise_for_status()
        zone_checker.configure(zone_camera_id, name, points)
        send_zone(zone_camera_id, points, setor=setor)
        return {"type": "zone_updated", "ok": True, "removed": False,
                "request_id": request_id, "camera_id": zone_camera_id,
                "setor": setor, "pontos": points}
    return handle


# ── Resolve functions ──────────────────────────────────────────────────────────
def _resolve_sectors() -> dict[str, list[dict]]:
    """Agrupa câmeras cadastradas por setor. Sem câmeras → setor 'default' vazio."""
    try:
        resp = requests.get(CAMERAS_API_URL, timeout=2)
        cameras = resp.json().get("data", [])
    except Exception as e:
        print(f"[SETORES] Não foi possível buscar câmeras: {e}")
        cameras = []

    if not cameras:
        return {"default": []}

    sectors: dict[str, list[dict]] = {}
    for cam in cameras:
        s = cam.get("setor") or "default"
        sectors.setdefault(s, []).append(cam)
    return sectors


def _make_resolve_fn(setor: str, papel: str, env_var: str | None = None, default=None):
    """Retorna uma função que resolve a URL atual da câmera com o papel dado no setor."""
    def resolve():
        if env_var:
            val = os.environ.get(env_var)
            if val is not None:
                return int(val) if val.isdigit() else (val or default)
        try:
            resp = requests.get(CAMERAS_API_URL, timeout=2)
            cameras = resp.json().get("data", [])
            sector_cams = [c for c in cameras if (c.get("setor") or "default") == setor]
            cam = next((c for c in sector_cams if c.get("papel") == papel), None)
            if cam:
                return cam["streamUrl"]
        except Exception:
            pass
        return default
    return resolve


# ── Capture loop ───────────────────────────────────────────────────────────────
def _capture_loop(
    resolve_source_fn,
    frame_q: queue.Queue,
    max_width: int | None = None,
    label: str = "câmera",
    stop_event: threading.Event | None = None,
    camera_id=None,
    setor: str = "",
    source: str = "frontal",
):
    camera = None
    current_source = None
    last_check = 0.0
    retry_event = _get_camera_retry_event(camera_id, setor, source)

    def _reconnect(new_source):
        nonlocal camera, current_source
        if camera is not None:
            try:
                camera.release()
            except Exception:
                pass
            camera = None
        if new_source is None:
            current_source = None
            send_stream_status(camera_id, setor, source, "offline", "origem_nao_configurada")
            return
        try:
            camera = Camera(source=new_source)
            camera.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, max_width or 640)
            camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            current_source = new_source
            print(f"[CAMERA] {label}: conectado em {new_source}")
            send_stream_status(camera_id, setor, source, "online")
        except Exception as e:
            print(f"[CAMERA] {label}: falha ao abrir {new_source} ({e})")
            camera = None
            current_source = new_source
            send_stream_status(camera_id, setor, source, "offline", "falha_ao_abrir")

    try:
        while not (stop_event and stop_event.is_set()):
            now = time.time()
            retry_requested = retry_event.is_set()
            if retry_requested:
                retry_event.clear()
            if now - last_check >= RECHECK_CAMERA_INTERVAL_S or (camera is None and last_check == 0.0) or retry_requested:
                last_check = now
                new_source = resolve_source_fn()
                if retry_requested or new_source != current_source:
                    if retry_requested:
                        print(f"[CAMERA] {label}: nova tentativa solicitada pelo usuário.")
                    elif current_source is not None:
                        print(f"[CAMERA] {label}: cadastro mudou ({current_source} → {new_source}), reconectando...")
                    _reconnect(new_source)

            if camera is not None and not camera.is_opened():
                print(f"[CAMERA] {label}: stream parou; aguardando nova tentativa.")
                camera.release()
                camera = None
                send_stream_status(camera_id, setor, source, "offline", "stream_parou")
                continue

            if camera is None:
                time.sleep(1)
                continue

            ret, frame = camera.read()
            if not ret:
                print(f"[CAMERA] {label}: leitura falhou; aguardando nova tentativa.")
                camera.release()
                camera = None
                send_stream_status(camera_id, setor, source, "offline", "falha_de_leitura")
                continue

            if max_width and frame.shape[1] > max_width:
                scale = max_width / frame.shape[1]
                frame = cv2.resize(frame, (max_width, int(frame.shape[0] * scale)))
            if frame_q.full():
                try: frame_q.get_nowait()
                except queue.Empty: pass
            frame_q.put(frame)
    finally:
        if camera is not None:
            try: camera.release()
            except Exception: pass
        send_stream_status(camera_id, setor, source, "offline", "captura_encerrada")
        with _camera_retry_lock:
            _camera_retry_events.pop(_camera_runtime_key(camera_id, setor, source), None)


# ── Pipeline de setor ──────────────────────────────────────────────────────────
def _run_sector(
    setor:          str,
    cameras:        list[dict],
    models:         dict,
    inference_lock: threading.Lock,
    zone_checker:   ZoneChecker,
    stop_event:     threading.Event,
):
    epi_detector  = models["epi_detector"]
    pose_model    = models["pose_model"]
    pose_analyzer = models["pose_analyzer"]

    cam_frontal      = next((c for c in cameras if c.get("papel") == "frontal"), None)
    cam_lateral      = next((c for c in cameras if c.get("papel") == "lateral"), None)
    has_frontal_cam  = cam_frontal is not None
    # Se não houver câmera frontal cadastrada, usa qualquer câmera como fallback de captura
    if cam_frontal is None and cameras:
        cam_frontal = cameras[0]

    primary_camera_id = cam_frontal.get("id") if cam_frontal else None
    primary_source = (cam_frontal.get("papel") or "frontal") if cam_frontal else "frontal"
    lateral_camera_id = cam_lateral.get("id") if cam_lateral else None
    primary_zone_id = f"cam_{primary_camera_id}" if primary_camera_id is not None else f"cam_{setor}"
    lateral_zone_id = f"cam_{lateral_camera_id}" if lateral_camera_id is not None else None
    zone_camera_ids = list(dict.fromkeys(
        zone_id for zone_id in (primary_zone_id, lateral_zone_id) if zone_id
    ))
    for zone_id in zone_camera_ids:
        _load_zona(
            zone_checker,
            zone_id,
            setor=setor,
            allow_local=(not cameras and zone_id == primary_zone_id),
        )

    # Resolve functions para _capture_loop
    if setor == "default" and not cameras:
        # Fallback: sem câmeras cadastradas, usa env vars / webcam local
        resolve_frontal = _make_resolve_fn("default", "frontal", env_var="CAMERA_SOURCE", default=0)
        resolve_lateral = _make_resolve_fn("default", "lateral", env_var="CAMERA_SOURCE_LATERAL", default=None)
    else:
        if has_frontal_cam:
            resolve_frontal = _make_resolve_fn(setor, "frontal")
        else:
            resolve_frontal = lambda: cameras[0].get("streamUrl") if cameras else None
        resolve_lateral = _make_resolve_fn(setor, "lateral")

    frame_queue         = queue.Queue(maxsize=2)
    frame_queue_lateral = queue.Queue(maxsize=2)
    _last_lateral_frame = {"frame": None, "received_at": 0.0}

    t_frontal = threading.Thread(
        target=_capture_loop,
        args=(resolve_frontal, frame_queue, 640, f"{setor}/frontal", stop_event,
              primary_camera_id, setor, primary_source),
        daemon=True,
    )
    t_lateral = None
    if has_frontal_cam and cam_lateral is not None:
        t_lateral = threading.Thread(
            target=_capture_loop,
            args=(resolve_lateral, frame_queue_lateral, 480, f"{setor}/lateral", stop_event,
                  lateral_camera_id, setor, "lateral"),
            daemon=True,
        )
    t_frontal.start()
    if t_lateral is not None:
        t_lateral.start()

    epi_debouncer   = IncidentDebouncer(required_frames=FRAMES_EPI,  cooldown_frames=COOLDOWN_EPI)
    ergo_debouncer  = SimpleDebouncer(required_frames=FRAMES_ERGO, cooldown_frames=COOLDOWN_ERGO)
    zona_debouncers = {
        zone_id: SimpleDebouncer(required_frames=FRAMES_ZONA, cooldown_frames=COOLDOWN_ZONA)
        for zone_id in zone_camera_ids
    }
    queda_debouncer = SimpleDebouncer(required_frames=6, cooldown_frames=120)
    _frame_interval = 1.0 / 10   # máx 10 FPS por setor no WebSocket
    _last_frame_t   = 0.0
    _last_verdict_key = None
    _last_verdict_t   = 0.0
    _last_metrics_t   = 0.0

    _epi_state         = {"counter": 0, "cache": [], "running": False}
    _epi_state_lateral = {"counter": 0, "cache": [], "running": False}
    _pose_state = {
        "counter": 0, "raw": None, "raw_frontal": None, "raw_lateral": None,
        "lat_ms": 0.0, "pck": None,
        "pessoas": [], "pessoas_frontal": [], "pessoas_lateral": [],
        "running": False, "dirty": False,
    }
    _verdict_cooldown = 0

    configured_zone_ids = [zone_id for zone_id in zone_camera_ids if zone_checker.get(zone_id)]
    print(f"[SETOR] '{setor}': pipeline ativo | cameras_zona={zone_camera_ids} | "
          f"frontal={'sim' if cam_frontal else 'webcam'} | "
          f"lateral={'sim' if cam_lateral else 'não'} | "
          f"zonas_configuradas={configured_zone_ids or 'nenhuma'}")

    while not stop_event.is_set():
        try:
            frame = frame_queue.get(timeout=0.5)
        except queue.Empty:
            frame = None

        try:
            _last_lateral_frame["frame"] = frame_queue_lateral.get_nowait()
            _last_lateral_frame["received_at"] = time.monotonic()
        except queue.Empty:
            pass

        if frame is None:
            time.sleep(0.1)
            continue

        t_start = time.perf_counter()

        frame_pose = frame
        # has_lateral: só True quando há câmera FRONTAL dedicada E câmera lateral com frame
        # (setor com câmera única nunca é tratado como dual-cam)
        lateral_is_fresh = (
            _last_lateral_frame["frame"] is not None
            and time.monotonic() - _last_lateral_frame["received_at"] <= 2.0
        )
        has_lateral = has_frontal_cam and (cam_lateral is not None) and lateral_is_fresh
        if has_lateral:
            frame_pose = _last_lateral_frame["frame"]

        # === 0. LIBERA STREAM DE VÍDEO IMEDIATAMENTE AO WEBSOCKET (ZERO LATÊNCIA VISUAL) ===
        _now_t = time.perf_counter()
        if _now_t - _last_frame_t >= _frame_interval:
            _last_frame_t = _now_t
            if has_frontal_cam:
                _camera_frame_shapes[str(primary_camera_id)] = (int(frame.shape[1]), int(frame.shape[0]))
                send_tagged_frame(frame, setor=setor, source="frontal", camera_id=primary_camera_id)
                if has_lateral:
                    _camera_frame_shapes[str(lateral_camera_id)] = (int(frame_pose.shape[1]), int(frame_pose.shape[0]))
                    send_tagged_frame(frame_pose, setor=setor, source="lateral", camera_id=lateral_camera_id)
            elif frame is not None:
                if primary_camera_id is not None:
                    _camera_frame_shapes[str(primary_camera_id)] = (int(frame.shape[1]), int(frame.shape[0]))
                send_tagged_frame(frame, setor=setor, source=primary_source, camera_id=primary_camera_id)

        # 1. EPI — background, a cada 5 frames, com lock de inferência
        # _prefixes=None → detecta tudo; _prefixes=[] → pula EPI (nenhum configurado)
        _primary_prefixes = epi_prefixes_ativos(setor, primary_camera_id)
        _lateral_prefixes = epi_prefixes_ativos(setor, lateral_camera_id) if has_lateral else []
        if _primary_prefixes != []:
            # EPI na câmera frontal
            _epi_state["counter"] += 1
            if _epi_state["counter"] >= 5 and not _epi_state["running"]:
                _epi_state["counter"]  = 0
                _epi_state["running"]  = True
                _frame_snap = frame.copy()
                def _epi_bg(snap=_frame_snap):
                    with inference_lock:
                        result = epi_detector.run(snap)
                    _epi_state["cache"]   = result
                    _epi_state["running"] = False
                threading.Thread(target=_epi_bg, daemon=True).start()

        else:
            _epi_state["cache"] = []

        # EPI na câmera lateral (quando disponível) — configuração independente
        if has_lateral and _lateral_prefixes != []:
                _epi_state_lateral["counter"] += 1
                if _epi_state_lateral["counter"] >= 5 and not _epi_state_lateral["running"]:
                    _epi_state_lateral["counter"] = 0
                    _epi_state_lateral["running"] = True
                    _frame_lat_snap = _last_lateral_frame["frame"].copy()
                    def _epi_lat_bg(snap=_frame_lat_snap):
                        with inference_lock:
                            result = epi_detector.run(snap)
                        _epi_state_lateral["cache"]   = result
                        _epi_state_lateral["running"] = False
                    threading.Thread(target=_epi_lat_bg, daemon=True).start()
        else:
            _epi_state_lateral["cache"] = []

        def _filter_epi(detections, prefixes):
            return [d for d in detections if d.label.startswith("PESSOA")
                    or prefixes is None
                    or any(d.label.startswith(prefix) for prefix in prefixes)]

        primary_epi_dets = _filter_epi(_epi_state["cache"], _primary_prefixes)
        lateral_epi_dets = _filter_epi(_epi_state_lateral["cache"], _lateral_prefixes) if has_lateral else []
        epi_dets = primary_epi_dets + lateral_epi_dets

        epi_incidents  = epi_detector.incidents(epi_dets)
        epi_confirmed  = epi_debouncer.update(epi_incidents)
        conf_media_epi = (
            round(sum(d.confidence for d in epi_dets) / len(epi_dets), 4)
            if epi_dets else None
        )

        # 2. Pose — também é necessária para localizar pessoas dentro das zonas,
        # mesmo quando a análise ergonômica estiver desativada.
        zona_ativa_no_setor = any(zone_checker.get(zone_id) for zone_id in zone_camera_ids)
        if ergonomia_ativa(setor) or zona_ativa_no_setor:
            _pose_state["counter"] += 1
            if _pose_state["counter"] >= 2 and not _pose_state["running"]:
                _pose_state["counter"] = 0
                _pose_state["running"] = True
                _snap_pose     = frame_pose.copy()
                _snap_frontal  = frame.copy() if has_lateral else None
                _dual          = has_lateral

                def _pose_bg(snap_pose=_snap_pose, snap_frontal=_snap_frontal, _has_lat=_dual):
                    try:
                        with inference_lock:
                            raw_lat = pose_model(snap_pose, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
                        pessoas_lat = pose_analyzer.analyze_from_results(raw_lat)

                        if _has_lat and snap_frontal is not None:
                            with inference_lock:
                                raw_front = pose_model(snap_frontal, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
                            pessoas_front = pose_analyzer.analyze_from_results(raw_front)
                            _pose_state["pessoas_frontal"] = pessoas_front
                            _pose_state["pessoas_lateral"] = pessoas_lat
                            _pose_state["raw_frontal"] = raw_front
                            _pose_state["raw_lateral"] = raw_lat
                            if CAMERA_DUAL_MODE == "mesma_pessoa":
                                _pose_state["pessoas"] = _merge_pose_readings(pessoas_front, pessoas_lat)
                            else:
                                _pose_state["pessoas"] = pessoas_front + pessoas_lat
                        else:
                            _pose_state["pessoas_frontal"] = pessoas_lat
                            _pose_state["pessoas_lateral"] = []
                            _pose_state["pessoas"] = pessoas_lat
                            _pose_state["raw_frontal"] = raw_lat
                            _pose_state["raw_lateral"] = None

                        _pose_state["raw"]    = raw_lat
                        _pose_state["lat_ms"] = raw_lat[0].speed.get("inference", 0.0)
                        _pose_state["pck"]    = _calc_pck(raw_lat)
                        _pose_state["dirty"]  = True
                    finally:
                        _pose_state["running"] = False

                threading.Thread(target=_pose_bg, daemon=True).start()
        else:
            _pose_state.update({
                "raw": None, "raw_frontal": None, "raw_lateral": None,
                "lat_ms": 0.0, "pck": None,
                "pessoas": [], "pessoas_frontal": [], "pessoas_lateral": [],
                "running": False, "dirty": False,
            })

        raw_pose    = _pose_state["raw"]
        lat_pose_ms = _pose_state["lat_ms"]
        pck_pose    = _pose_state["pck"]
        ergo_pessoas = _pose_state["pessoas"]

        ergo_em_risco  = [p for p in ergo_pessoas if _pessoa_em_risco_ergo(p)]
        ergo_confirmed = ergo_debouncer.update(len(ergo_em_risco) > 0)

        queda_detectada = any(p.get("queda", False) for p in ergo_pessoas)
        queda_confirmed = queda_debouncer.update(queda_detectada)

        zone_inputs = [(primary_zone_id, _pose_state["raw_frontal"], primary_source, primary_camera_id)]
        if has_lateral and lateral_zone_id and lateral_zone_id != primary_zone_id:
            zone_inputs.append((lateral_zone_id, _pose_state["raw_lateral"], "lateral", lateral_camera_id))

        zona_pessoas = []
        zona_confirmadas = []
        for zone_id, zone_results, zone_source, zone_camera_id in zone_inputs:
            zone_config = zone_checker.get(zone_id)
            if zone_config is None or zone_results is None:
                continue
            _, pessoas_da_zona = zone_checker.check_from_results(zone_id, zone_results)
            pessoas_da_zona = [
                {
                    **p,
                    "nome": zone_config.get("nome", "Zona de Risco"),
                    "pontos": zone_config.get("pontos", []),
                    "source": zone_source,
                    "camera_id": zone_camera_id,
                    "zone_id": zone_id,
                }
                for p in pessoas_da_zona
            ]
            invasores = [p for p in pessoas_da_zona if p.get("invadiu")]
            zona_pessoas.extend(pessoas_da_zona)
            debouncer = zona_debouncers.setdefault(
                zone_id,
                SimpleDebouncer(required_frames=FRAMES_ZONA, cooldown_frames=COOLDOWN_ZONA),
            )
            if debouncer.update(bool(invasores)):
                zona_confirmadas.extend(invasores)

        zona_confirmed = bool(zona_confirmadas)

        # 4. Verdict em tempo real (envia quando status/reasons mudam ou heartbeat a cada 1s)
        zona_em_risco = [p for p in zona_pessoas if p["invadiu"]]
        live_verdict  = _aggregate(epi_incidents, ergo_em_risco, zona_em_risco, epi_dets=epi_dets)

        _now_t = time.perf_counter()
        _verdict_key = (live_verdict.status, tuple(sorted(live_verdict.reasons)))
        if _verdict_key != _last_verdict_key or (_now_t - _last_verdict_t >= 1.0):
            _last_verdict_key = _verdict_key
            _last_verdict_t   = _now_t
            _send_verdict(live_verdict, setor=setor)

        # 4.5 Queda
        if queda_confirmed:
            send_queda(
                pessoas=[p["pessoa_id"] for p in ergo_pessoas if p.get("queda")],
                timestamp=datetime.now().isoformat(),
                setor=setor,
                camera_id=lateral_camera_id if has_lateral else primary_camera_id,
                source="lateral" if has_lateral else primary_source,
            )

        for zone_id in dict.fromkeys(p["zone_id"] for p in zona_confirmadas):
            invasor = next(p for p in zona_confirmadas if p["zone_id"] == zone_id)
            send_alert(
                label="Zona de Risco",
                confidence=1.0,
                timestamp=datetime.now().isoformat(),
                setor=setor,
                camera_id=invasor.get("camera_id"),
                source=invasor.get("source"),
            )

        # 5. Envia metadados de ML ao WebSocket (detecções de EPI e pose/esqueleto)
        primary_missing_epi = [
            d for d in primary_epi_dets
            if "AUSENTE" in d.label.upper() or "ERRADO" in d.label.upper()
        ]
        lateral_missing_epi = [
            d for d in lateral_epi_dets
            if "AUSENTE" in d.label.upper() or "ERRADO" in d.label.upper()
        ]
        send_detections(
            [{"label": d.label, "confidence": round(float(d.confidence), 4),
              "x1": int(d.x1), "y1": int(d.y1), "x2": int(d.x2), "y2": int(d.y2)}
             for d in primary_missing_epi],
            setor=setor, source=primary_source, camera_id=primary_camera_id,
        )
        if has_lateral:
            send_detections(
                [{"label": d.label, "confidence": round(float(d.confidence), 4),
                  "x1": int(d.x1), "y1": int(d.y1), "x2": int(d.x2), "y2": int(d.y2)}
                 for d in lateral_missing_epi],
                setor=setor, source="lateral", camera_id=lateral_camera_id,
            )
        if _pose_state["dirty"]:
            _pose_state["dirty"] = False
            if has_frontal_cam:
                send_pose(_pose_state["pessoas_frontal"], source="frontal", setor=setor)
                if has_lateral:
                    send_pose(_pose_state["pessoas_lateral"], source="lateral", setor=setor)
            else:
                send_pose(_pose_state["pessoas_frontal"], source=primary_source, setor=setor)

        # 6. Incident confirmado → beep + banco
        if epi_confirmed or ergo_confirmed or zona_confirmed:
            confirmed_verdict = _aggregate(
                epi_confirmed,
                ergo_pessoas if ergo_confirmed else [],
                zona_confirmadas,
                epi_dets=epi_dets,
            )
            timestamp = datetime.now()

            for d in epi_confirmed:
                send_alert(
                    label=d.label,
                    confidence=round(float(d.confidence), 4),
                    timestamp=timestamp.isoformat(),
                    setor=setor,
                )

            threading.Thread(target=_beep, daemon=True).start()

            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            img_b64   = base64.b64encode(buffer).decode("utf-8")
            incident_zone = zona_confirmadas[0] if zona_confirmadas else None

            details = {
                "status": confirmed_verdict.status,
                "epi": [
                    {
                        "label":      d.label,
                        "confidence": round(float(d.confidence), 4),
                        "bbox":       [int(d.x1), int(d.y1), int(d.x2), int(d.y2)],
                    }
                    for d in (epi_dets or epi_confirmed)
                ],
                "ergonomia": [
                    {
                        "pessoa_id":  p.get("pessoa_id"),
                        "reba_score": p.get("reba_score"),
                        "reba_level": p.get("reba_level"),
                        "confianca":  round(float(p.get("confianca_deteccao", 0)), 4),
                        "queda":      p.get("queda", False),
                        "bbox":       p.get("bbox"),
                        "keypoints":  p.get("keypoints"),
                    }
                    for p in ergo_pessoas
                ],
                "zona": [
                    {
                        "pessoa_id": p.get("pessoa_id"),
                        "invadiu":   p.get("invadiu", False),
                        "nome": p.get("nome", "Zona de Risco"),
                        "pontos": p.get("pontos", []),
                        "source": p.get("source"),
                        "camera_id": p.get("camera_id"),
                        "epis_ausentes": [
                            epi_label
                            for epi_id, epi_label in zip(
                                p.get("epis_obrigatorios", []),
                                p.get("epis_certo_labels", []),
                            )
                            if epi_label not in {d.label for d in (epi_dets or [])}
                        ],
                    }
                    for p in zona_confirmadas
                ],
                "zona_config": {
                    "nome": incident_zone.get("nome", "Zona de Risco"),
                    "pontos": incident_zone.get("pontos", []),
                    "source": incident_zone.get("source"),
                    "camera_id": incident_zone.get("camera_id"),
                } if incident_zone else None,
            }

            payload = {
                "timestamp":  timestamp.isoformat(),
                "label":      ", ".join(confirmed_verdict.reasons),
                "confidence": confirmed_verdict.confidence,
                "img_Frame":  img_b64,
                "source":     ", ".join(confirmed_verdict.sources),
                "camera_id":  incident_zone.get("camera_id") if incident_zone else primary_camera_id,
                "setor":      setor,
                "details":    details,
            }

            # só salva lateral quando há câmera frontal E lateral distintas
            if has_lateral and has_frontal_cam:
                _, buffer_lateral = cv2.imencode(".jpg", frame_pose, [cv2.IMWRITE_JPEG_QUALITY, 70])
                payload["img_Frame_lateral"] = base64.b64encode(buffer_lateral).decode("utf-8")

            _post_queue.put(payload)

        # 7. Métricas (a cada 0.5s para não sobrecarregar o WebSocket)
        if _now_t - _last_metrics_t >= 0.5:
            _last_metrics_t = _now_t
            lat_total_ms = (time.perf_counter() - t_start) * 1000
            _send_metrics(lat_total_ms, 0.0, lat_pose_ms, pck_pose, conf_media_epi, setor=setor)

    stop_event.set()
    t_frontal.join(timeout=3)
    if t_lateral is not None:
        t_lateral.join(timeout=3)
    print(f"[SETOR] '{setor}': pipeline encerrado.")


# ── Gerenciador de setores ─────────────────────────────────────────────────────
_active_sectors: dict[str, dict] = {}
_active_sectors_lock = threading.Lock()


def _sector_manager(models: dict, inference_lock: threading.Lock, zone_checker: ZoneChecker):
    """Monitora novos setores / câmeras e inicia/reinicia pipelines conforme necessário."""
    global _active_sectors

    while True:
        sectors = _resolve_sectors()

        with _active_sectors_lock:
            # Iniciar setores novos ou com câmeras diferentes
            for setor, cameras in sectors.items():
                cam_ids = frozenset(
                    (c["id"], c.get("papel") or "frontal", c.get("streamUrl", ""))
                    for c in cameras
                )
                existing = _active_sectors.get(setor)

                if existing is None:
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)
                elif existing["cam_ids"] != cam_ids:
                    print(f"[SETOR] '{setor}': câmeras alteradas, reiniciando pipeline...")
                    existing["stop_event"].set()
                    existing["thread"].join(timeout=8)
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)

            # Encerrar setores removidos
            for setor in list(_active_sectors.keys()):
                if setor not in sectors:
                    print(f"[SETOR] '{setor}': encerrado (câmeras removidas do cadastro).")
                    _active_sectors[setor]["stop_event"].set()
                    _active_sectors[setor]["thread"].join(timeout=8)
                    del _active_sectors[setor]

        time.sleep(SECTOR_CHECK_INTERVAL_S)


def _start_sector(setor: str, cameras: list[dict], models: dict, inference_lock: threading.Lock, zone_checker: ZoneChecker):
    stop_event = threading.Event()
    cam_ids = frozenset(
        (c["id"], c.get("papel") or "frontal", c.get("streamUrl", ""))
        for c in cameras
    )
    t = threading.Thread(
        target=_run_sector,
        args=(setor, cameras, models, inference_lock, zone_checker, stop_event),
        daemon=True,
        name=f"sector-{setor}",
    )
    _active_sectors[setor] = {"thread": t, "stop_event": stop_event, "cam_ids": cam_ids}
    t.start()
    print(f"[SETOR] '{setor}': iniciado com {len(cameras)} câmera(s).")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    model_epi  = os.path.join(ROOT, "ml_service", "vision", "models", "best.pt")
    model_pose = os.path.join(ROOT, "yolov8n-pose.pt")

    try:
        import torch
        torch.set_num_threads(len(_ORCH_CORES))
    except ImportError:
        pass

    # Abre o canal de eventos antes do carregamento dos modelos, que pode levar
    # alguns segundos no fallback .pt. Assim o frontend não fica recusando conexão.
    zone_checker = ZoneChecker(model_path=None)
    set_message_handler(_make_ws_message_handler(zone_checker))
    start_server_in_thread()

    print("[INIT] Carregando modelos...")
    try:
        epi_detector  = EPIDetector(model_path=model_epi, imgsz=MODEL_IMGSZ)
        pose_model    = load_yolo_with_engine_fallback(model_pose, imgsz=MODEL_IMGSZ)
        pose_analyzer = PoseAnalyzer(model_path=None)
    except Exception as e:
        print(f"[ERRO] Falha na inicialização: {e}")
        return

    models = {
        "epi_detector":  epi_detector,
        "pose_model":    pose_model,
        "pose_analyzer": pose_analyzer,
    }
    inference_lock = threading.Lock()

    threading.Thread(target=_post_worker, daemon=True).start()
    ml_thread_metrics_service.start()

    # Inicia o servidor de configuração (zona + analise) com um zone_checker compartilhado
    # camera_id inicial = "cam_01" (sobrescrito por cada setor ao carregar sua zona)
    config_server.start(zone_checker, "cam_01", CONFIG_SERVER_PORT)

    print("[OK] Orquestrador multi-setor ativo. Detectando setores...")
    print(f"     Intervalo de verificação de setores: {SECTOR_CHECK_INTERVAL_S}s")

    # Manager roda em thread dedicada — monitora novos setores indefinidamente
    threading.Thread(
        target=_sector_manager,
        args=(models, inference_lock, zone_checker),
        daemon=True,
        name="sector-manager",
    ).start()

    # Aguarda (loop principal só existe pra manter o processo vivo e checar ESC)
    try:
        while True:
            if cv2.waitKey(100) & 0xFF == 27:
                break
            time.sleep(0.1)
    finally:
        ml_thread_metrics_service.stop()
        cv2.destroyAllWindows()
        print("[OK] Orquestrador encerrado.")


if __name__ == "__main__":
    main()
