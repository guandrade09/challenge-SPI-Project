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

from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from ml_service.inference.model_loader import load_yolo_with_engine_fallback
from ml_service.streaming.websocket_server import (
    send_tagged_frame, send_alert, send_pose, send_detections, send_zone, start_server_in_thread,
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
    if not _ws._loop or not _ws.CONNECTED_CLIENTS:
        return
    msg = json.dumps({
        "type":       "verdict",
        "status":     verdict.status,
        "reasons":    verdict.reasons,
        "confidence": verdict.confidence,
        "sources":    verdict.sources,
        "timestamp":  verdict.timestamp,
        "setor":      setor,
    })
    async def _broadcast():
        for client in list(_ws.CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                _ws.CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _ws._loop)


def _send_metrics(lat_total_ms, lat_epi_ms, lat_pose_ms, pck_pose, conf_media_epi, setor: str = ""):
    if not _ws._loop or not _ws.CONNECTED_CLIENTS:
        return
    msg = json.dumps({
        "type":               "metrics",
        "latencia_total_ms":  round(lat_total_ms, 1),
        "latencia_epi_ms":    round(lat_epi_ms, 1),
        "latencia_pose_ms":   round(lat_pose_ms, 1),
        "pck_pose":           pck_pose,
        "conf_media_epi":     conf_media_epi,
        "setor":              setor,
    })
    async def _broadcast():
        for client in list(_ws.CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                _ws.CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _ws._loop)


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
            requests.post(BACKEND_URL, json=payload, timeout=2)
        except Exception as e:
            print(f"[POST] falha: {e}")
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

def _load_zona(zone_checker, camera_id: str, setor: str = "") -> bool:
    config = _fetch_zona_from_backend(camera_id)
    if config is None:
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
):
    camera = None
    current_source = None
    last_check = 0.0

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
            return
        try:
            camera = Camera(source=new_source)
            camera.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, max_width or 640)
            camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            current_source = new_source
            print(f"[CAMERA] {label}: conectado em {new_source}")
        except Exception as e:
            print(f"[CAMERA] {label}: falha ao abrir {new_source} ({e})")
            camera = None
            current_source = None  # força nova tentativa na próxima verificação periódica

    while not (stop_event and stop_event.is_set()):
        now = time.time()
        if now - last_check >= RECHECK_CAMERA_INTERVAL_S or (camera is None and last_check == 0.0):
            last_check = now
            new_source = resolve_source_fn()
            if new_source != current_source:
                if current_source is not None:
                    print(f"[CAMERA] {label}: cadastro mudou ({current_source} → {new_source}), reconectando...")
                _reconnect(new_source)

        if camera is not None and not camera.is_opened():
            print(f"[CAMERA] {label}: stream parou, reconectando...")
            try:
                camera.release()
            except Exception:
                pass
            camera = None
            current_source = None
            last_check = 0.0
            continue

        if camera is None:
            time.sleep(1)
            continue

        ret, frame = camera.read()
        if not ret:
            print(f"[CAMERA] {label}: leitura falhou, reconectando.")
            try:
                camera.release()
            except Exception:
                pass
            camera = None
            current_source = None
            last_check = 0.0
            continue

        if max_width and frame.shape[1] > max_width:
            scale = max_width / frame.shape[1]
            frame = cv2.resize(frame, (max_width, int(frame.shape[0] * scale)))
        if frame_q.full():
            try:
                frame_q.get_nowait()
            except queue.Empty:
                pass
        frame_q.put(frame)


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

    # camera_id: usado pelo zone_checker e no payload do banco
    camera_id = f"cam_{cam_frontal['id']}" if cam_frontal else f"cam_{setor}"

    _load_zona(zone_checker, camera_id, setor=setor)

    # Resolve functions para _capture_loop
    if setor == "default" and not cameras:
        # Fallback: sem câmeras cadastradas, usa env vars / webcam local
        resolve_frontal = _make_resolve_fn("default", "frontal", env_var="CAMERA_SOURCE", default=0)
        resolve_lateral = _make_resolve_fn("default", "lateral", env_var="CAMERA_SOURCE_LATERAL", default=None)
    else:
        resolve_frontal = _make_resolve_fn(setor, "frontal")
        resolve_lateral = _make_resolve_fn(setor, "lateral")

    frame_queue         = queue.Queue(maxsize=2)
    frame_queue_lateral = queue.Queue(maxsize=2)
    _last_lateral_frame = {"frame": None}

    t_frontal = threading.Thread(
        target=_capture_loop,
        args=(resolve_frontal, frame_queue, 640, f"{setor}/frontal", stop_event),
        daemon=True,
    )
    t_lateral = threading.Thread(
        target=_capture_loop,
        args=(resolve_lateral, frame_queue_lateral, 480, f"{setor}/lateral", stop_event),
        daemon=True,
    )
    t_frontal.start()
    t_lateral.start()

    epi_debouncer   = IncidentDebouncer(required_frames=FRAMES_EPI,  cooldown_frames=COOLDOWN_EPI)
    ergo_debouncer  = SimpleDebouncer(required_frames=FRAMES_ERGO, cooldown_frames=COOLDOWN_ERGO)
    zona_debouncer  = SimpleDebouncer(required_frames=FRAMES_ZONA, cooldown_frames=COOLDOWN_ZONA)
    queda_debouncer = SimpleDebouncer(required_frames=6, cooldown_frames=120)
    _frame_interval = 1.0 / 10   # máx 10 FPS por setor no WebSocket
    _last_frame_t   = 0.0

    _epi_state         = {"counter": 0, "cache": [], "running": False}
    _epi_state_lateral = {"counter": 0, "cache": [], "running": False}
    _pose_state = {
        "counter": 0, "raw": None, "lat_ms": 0.0, "pck": None,
        "pessoas": [], "pessoas_frontal": [], "pessoas_lateral": [],
        "running": False, "dirty": False,
    }
    _verdict_cooldown = 0

    zona_info = zone_checker.get(camera_id)
    print(f"[SETOR] '{setor}': pipeline ativo | camera_id={camera_id} | "
          f"frontal={'sim' if cam_frontal else 'webcam'} | "
          f"lateral={'sim' if cam_lateral else 'não'} | "
          f"zona={'configurada' if zona_info else 'não configurada'}")

    while not stop_event.is_set():
        try:
            frame = frame_queue.get(timeout=0.5)
        except queue.Empty:
            frame = None

        try:
            _last_lateral_frame["frame"] = frame_queue_lateral.get_nowait()
        except queue.Empty:
            pass

        if frame is None:
            if _last_lateral_frame["frame"] is not None:
                frame = _last_lateral_frame["frame"]
            else:
                time.sleep(0.1)
                continue

        t_start = time.perf_counter()

        frame_pose = frame
        # has_lateral: só True quando há câmera FRONTAL dedicada E câmera lateral com frame
        # (setor com câmera única nunca é tratado como dual-cam)
        has_lateral = has_frontal_cam and (cam_lateral is not None) and (_last_lateral_frame["frame"] is not None)
        if has_lateral:
            frame_pose = _last_lateral_frame["frame"]

        # 1. EPI — background, a cada 5 frames, com lock de inferência
        # _prefixes=None → detecta tudo; _prefixes=[] → pula EPI (nenhum configurado)
        _prefixes = epi_prefixes_ativos(setor)
        if _prefixes != []:
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

            # EPI na câmera lateral (quando disponível) — ângulo complementar
            if has_lateral:
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
            _epi_state["cache"]         = []
            _epi_state_lateral["cache"] = []

        # Une detecções de ambas as câmeras (OR: se qualquer câmera vê, conta)
        epi_dets_raw = _epi_state["cache"] + (
            _epi_state_lateral["cache"] if has_lateral else []
        )
        epi_dets = [
            d for d in epi_dets_raw
            if d.label.startswith("PESSOA")
            or _prefixes is None
            or any(d.label.startswith(p) for p in _prefixes)
        ]

        epi_incidents  = epi_detector.incidents(epi_dets)
        epi_confirmed  = epi_debouncer.update(epi_incidents)
        conf_media_epi = (
            round(sum(d.confidence for d in epi_dets) / len(epi_dets), 4)
            if epi_dets else None
        )

        # 2. Pose — background thread, a cada 2 frames, com lock de inferência
        if ergonomia_ativa(setor):
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
                            if CAMERA_DUAL_MODE == "mesma_pessoa":
                                _pose_state["pessoas"] = _merge_pose_readings(pessoas_front, pessoas_lat)
                            else:
                                _pose_state["pessoas"] = pessoas_front + pessoas_lat
                        else:
                            _pose_state["pessoas_frontal"] = pessoas_lat
                            _pose_state["pessoas_lateral"] = []
                            _pose_state["pessoas"] = pessoas_lat

                        _pose_state["raw"]    = raw_lat
                        _pose_state["lat_ms"] = raw_lat[0].speed.get("inference", 0.0)
                        _pose_state["pck"]    = _calc_pck(raw_lat)
                        _pose_state["dirty"]  = True
                    finally:
                        _pose_state["running"] = False

                threading.Thread(target=_pose_bg, daemon=True).start()
        else:
            _pose_state.update({
                "raw": None, "lat_ms": 0.0, "pck": None,
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

        if zone_checker.get(camera_id) is not None:
            _, zona_pessoas = zone_checker.check_from_results(camera_id, raw_pose)
            zona_confirmed  = zona_debouncer.update(any(p["invadiu"] for p in zona_pessoas))
        else:
            zona_pessoas   = []
            zona_confirmed = False

        # 4. Verdict em tempo real
        zona_em_risco = [p for p in zona_pessoas if p["invadiu"]]
        live_verdict  = _aggregate(epi_incidents, ergo_em_risco, zona_em_risco, epi_dets=epi_dets)

        if live_verdict.status != "MONITORANDO":
            _verdict_cooldown = 20
            _send_verdict(live_verdict, setor=setor)
        elif _verdict_cooldown > 0:
            _verdict_cooldown -= 1
        else:
            _send_verdict(live_verdict, setor=setor)

        # 4.5 Queda
        if queda_confirmed and _ws._loop and _ws.CONNECTED_CLIENTS:
            _msg = json.dumps({
                "type":      "queda",
                "timestamp": datetime.now().isoformat(),
                "setor":     setor,
                "pessoas":   [p["pessoa_id"] for p in ergo_pessoas if p.get("queda")],
            })
            async def _send_queda():
                for client in list(_ws.CONNECTED_CLIENTS):
                    try:
                        await client.send(_msg)
                    except Exception:
                        _ws.CONNECTED_CLIENTS.discard(client)
            asyncio.run_coroutine_threadsafe(_send_queda(), _ws._loop)

        # 5. WebSocket → frontend (máx 10 FPS por setor para não saturar o WS)
        _now_t = time.perf_counter()
        if _now_t - _last_frame_t >= _frame_interval:
            _last_frame_t = _now_t
            if has_frontal_cam:
                send_tagged_frame(frame, setor=setor, source="frontal")
                if has_lateral:
                    send_tagged_frame(frame_pose, setor=setor, source="lateral")
            elif frame is not None:
                # Câmera única no setor (sem frontal dedicada) → envia como frontal
                send_tagged_frame(frame, setor=setor, source="frontal")
            # detecções EPI junto com o frame
            send_detections(
                [{"label": d.label, "confidence": round(float(d.confidence), 4),
                  "x1": int(d.x1), "y1": int(d.y1), "x2": int(d.x2), "y2": int(d.y2)}
                 for d in epi_dets],
                setor=setor,
            )
            # pose junto com o frame — evita saturar WS a cada iteração
            if _pose_state["dirty"]:
                _pose_state["dirty"] = False
                send_pose(_pose_state["pessoas_frontal"], source="frontal", setor=setor)
                if has_lateral:
                    send_pose(_pose_state["pessoas_lateral"], source="lateral", setor=setor)

        # 6. Incident confirmado → beep + banco
        if epi_confirmed or ergo_confirmed or zona_confirmed:
            confirmed_verdict = _aggregate(
                epi_confirmed,
                ergo_pessoas if ergo_confirmed else [],
                zona_pessoas  if zona_confirmed  else [],
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
                        "epis_ausentes": [
                            epi_label
                            for epi_id, epi_label in zip(
                                p.get("epis_obrigatorios", []),
                                p.get("epis_certo_labels", []),
                            )
                            if epi_label not in {d.label for d in (epi_dets or [])}
                        ],
                    }
                    for p in zona_pessoas
                ],
            }

            payload = {
                "timestamp":  timestamp.isoformat(),
                "label":      ", ".join(confirmed_verdict.reasons),
                "confidence": confirmed_verdict.confidence,
                "img_Frame":  img_b64,
                "source":     ", ".join(confirmed_verdict.sources),
                "camera_id":  camera_id,
                "setor":      setor,
                "details":    details,
            }

            # só salva lateral quando há câmera frontal E lateral distintas
            if has_lateral and has_frontal_cam:
                _, buffer_lateral = cv2.imencode(".jpg", frame_pose, [cv2.IMWRITE_JPEG_QUALITY, 70])
                payload["img_Frame_lateral"] = base64.b64encode(buffer_lateral).decode("utf-8")

            _post_queue.put(payload)

        # 7. Métricas
        lat_total_ms = (time.perf_counter() - t_start) * 1000
        _send_metrics(lat_total_ms, 0.0, lat_pose_ms, pck_pose, conf_media_epi, setor=setor)

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
                cam_ids = frozenset((c["id"], c.get("papel", "frontal"), c.get("streamUrl", "")) for c in cameras)
                existing = _active_sectors.get(setor)

                if existing is None:
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)
                elif existing["cam_ids"] != cam_ids:
                    print(f"[SETOR] '{setor}': câmeras alteradas, reiniciando pipeline...")
                    existing["stop_event"].set()
                    time.sleep(2)
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)

            # Encerrar setores removidos
            for setor in list(_active_sectors.keys()):
                if setor not in sectors:
                    print(f"[SETOR] '{setor}': encerrado (câmeras removidas do cadastro).")
                    _active_sectors[setor]["stop_event"].set()
                    del _active_sectors[setor]

        time.sleep(SECTOR_CHECK_INTERVAL_S)


def _start_sector(setor: str, cameras: list[dict], models: dict, inference_lock: threading.Lock, zone_checker: ZoneChecker):
    stop_event = threading.Event()
    cam_ids    = frozenset((c["id"], c.get("papel", "frontal")) for c in cameras)
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

    print("[INIT] Carregando modelos...")
    try:
        epi_detector  = EPIDetector(model_path=model_epi, imgsz=MODEL_IMGSZ)
        pose_model    = load_yolo_with_engine_fallback(model_pose, imgsz=MODEL_IMGSZ)
        pose_analyzer = PoseAnalyzer(model_path=None)
        zone_checker  = ZoneChecker(model_path=None)
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
    start_server_in_thread()

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
        cv2.destroyAllWindows()
        print("[OK] Orquestrador encerrado.")


if __name__ == "__main__":
    main()
