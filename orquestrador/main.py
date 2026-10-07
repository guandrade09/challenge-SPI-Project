"""
Orquestrador — Pipelines Independentes por Câmera
============================================================
Câmeras compartilham a tag `setor`, mas cada ID tem captura, análise EPI/pose/zona,
alertas e fila de evidências próprios. Uma câmera offline não impede as outras
de analisar e salvar incidentes. Os modelos YOLO são compartilhados e as
inferências locais usam um lock de GPU.

Adição de câmeras no frontend é detectada automaticamente (a cada 30 s) e
inicia somente o pipeline da câmera nova sem reiniciar as demais.
"""

import sys
import os
import asyncio
import queue
import threading
import time
import base64
import json
from copy import deepcopy
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
from incident_tracking import build_incident_tracking, synchronize_incident_view
from incident_worker import IncidentEvidenceWorker

from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from ml_service.inference.model_loader import load_yolo_with_engine_fallback
from ml_service.streaming.websocket_server import (
    send_tagged_frame, send_alert, send_pose, send_detections, send_zone,
    send_verdict, send_metrics, send_queda, send_stream_status, send_faces,
    set_message_handler, start_server_in_thread,
)
import ml_service.streaming.websocket_server as _ws
from core.entities import Detection
from pose_analyzer import PoseAnalyzer
from zone_checker import ZoneChecker
from ml_facial.face_recognizer import FaceRecognizer, FuncionarioFaceRegistry
import config_server
from config_server import epi_prefixes_ativos, ergonomia_ativa

# ── Configuração ───────────────────────────────────────────────────────────────
BACKEND_URL               = "http://localhost:3000/api/detections"
BACKEND_ZONAS_URL         = "http://localhost:3000/api/zonas"
BACKEND_FUNCIONARIOS_URL  = "http://localhost:3000/api/funcionarios"
BACKEND_RECONHECIMENTOS_URL = "http://localhost:3000/api/reconhecimentos-faciais"
CAMERAS_API_URL    = "http://localhost:3000/api/cameras"
CONFIG_SERVER_PORT = 5050

# Intervalo de verificação: novos setores / câmeras adicionadas no frontend
SECTOR_CHECK_INTERVAL_S  = 30
RECHECK_CAMERA_INTERVAL_S = 15

# Rotação configurável por câmera (graus → constante cv2.rotate). Aplicada em _capture_loop,
# antes de qualquer resize/inferência — o resto do pipeline nunca sabe que o frame foi girado.
_ROTATE_CV2 = {
    90:  cv2.ROTATE_90_CLOCKWISE,
    180: cv2.ROTATE_180,
    270: cv2.ROTATE_90_COUNTERCLOCKWISE,
}

# Frames consecutivos necessários para confirmar cada tipo de risco
FRAMES_EPI   = 10
FRAMES_ERGO  = 8
FRAMES_ZONA  = 3
FRAMES_FACIAL = 5
COOLDOWN_EPI  = 60
COOLDOWN_ERGO = 60
COOLDOWN_ZONA = 30
COOLDOWN_FACIAL = 90

# Intervalo entre inferências de reconhecimento facial (segundos) — não precisa rodar a
# cada frame como EPI/pose; identidade não muda de um frame pro outro. Reduzido de 1.5s:
# quanto maior esse valor, maior a defasagem entre a posição dos rostos usada por
# _resolve_pessoa_label e a posição real das pessoas no momento em que um incidente de
# EPI é confirmado (pipelines independentes, cada um amostra o mundo no seu próprio
# ritmo) — com pessoas em movimento, isso é o que faz a caixa "PESSOA" errar o rosto.
FACIAL_PROCESS_INTERVAL_S = 0.6

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
        self._counter = 0
        self._active  = False  # já confirmado, aguardando a infração sumir
        self.required = required_frames
        self.cooldown = cooldown_frames  # mantido pela API; não usado no latch (ver update)

    def update(self, is_risk: bool) -> bool:
        if not is_risk:
            self._active  = False
            self._counter = 0
            return False
        if self._active:
            return False
        self._counter += 1
        if self._counter >= self.required:
            self._active  = True
            self._counter = 0
            return True
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
            zone_epi_labels = p.get("epi_labels", all_epi_labels)
            required_epis = zip(epis_obrig, epis_certo) if p.get("epi_available", True) else []
            for epi_id, epi_label in required_epis:
                if epi_label not in zone_epi_labels:
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
def _send_verdict(verdict: Verdict, setor: str = "", camera_id=None, source="frontal"):
    send_verdict({
        "status":     verdict.status,
        "reasons":    verdict.reasons,
        "confidence": verdict.confidence,
        "sources":    verdict.sources,
        "timestamp":  verdict.timestamp,
        "camera_id": camera_id,
        "source": source,
    }, setor=setor)


def _send_metrics(lat_total_ms, lat_epi_ms, lat_pose_ms, pck_pose, conf_media_epi,
                  setor: str = "", camera_id=None, source="frontal"):
    send_metrics({
        "latencia_total_ms":  round(lat_total_ms, 1),
        "latencia_epi_ms":    round(lat_epi_ms, 1),
        "latencia_pose_ms":   round(lat_pose_ms, 1),
        "pck_pose":           pck_pose,
        "conf_media_epi":     conf_media_epi,
        "camera_id": camera_id,
        "source": source,
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
    print("[REALTIME] beep")
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


# ── Worker de POST HTTP (reconhecimento facial) ─────────────────────────────────
# Fila própria (em vez de reaproveitar _post_queue): o payload e o endpoint são
# diferentes de um incidente EPI/ergonomia/zona (ver ml_facial/README.md).
_facial_post_queue: queue.Queue = queue.Queue()

def _facial_post_worker():
    while True:
        payload = _facial_post_queue.get()
        try:
            last_error = None
            for attempt in range(1, 4):
                try:
                    response = requests.post(BACKEND_RECONHECIMENTOS_URL, json=payload, timeout=5)
                    response.raise_for_status()
                    print(
                        f"[FACIAL] reconhecimento salvo | nome={payload.get('nome_detectado')} | "
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
                    f"[FACIAL] reconhecimento não salvo após 3 tentativas | "
                    f"nome={payload.get('nome_detectado')} | erro={last_error}"
                )
        finally:
            _facial_post_queue.task_done()


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

# Último frame frontal capturado por _run_sector, por camera_id — o reconhecimento facial
# lê daqui em vez de abrir sua própria conexão com a câmera. Câmeras de rede baratas (ex.:
# apps tipo IP Webcam) costumam derrubar ou instabilizar o stream quando um segundo cliente
# conecta na mesma URL; abrir uma 2ª captura pro mesmo streamUrl foi o que causava a queda
# da imagem no frontend sempre que o setor de reconhecimento facial iniciava.
_latest_frontal_frames: dict[object, "np.ndarray"] = {}
_latest_frontal_frames_lock = threading.Lock()

# Último resultado do reconhecimento facial por camera_id (mesma lista enviada ao
# WebSocket em send_faces). _run_sector usa isso pra trocar o label genérico "PESSOA"
# pelo nome do funcionário reconhecido ao montar o incidente (ver _resolve_pessoa_label).
_latest_face_matches: dict[object, list[dict]] = {}
_latest_face_matches_lock = threading.Lock()


def _resolve_pessoa_label(detection, camera_id) -> str:
    """Se `detection` é uma caixa de pessoa ("PESSOA...") e o reconhecimento facial achou
    um rosto cujo centro cai dentro dessa caixa, devolve o nome do funcionário (se bateu
    com confiança suficiente — ver MIN_CONFIDENCE_RECONHECIMENTO em face_recognizer.py) ou
    "Desconhecido" (rosto detectado, mas não bate com ninguém cadastrado). Cada caixa
    "PESSOA" é resolvida pelo PRÓPRIO rosto que está dentro dela — com 2+ pessoas em cena,
    cada uma recebe o nome que lhe pertence, nunca o de outra. Sem nenhum rosto dentro da
    caixa (ângulo ruim, rosto fora de quadro), devolve o label original sem alteração."""
    if not detection.label.startswith("PESSOA"):
        return detection.label

    with _latest_face_matches_lock:
        faces = list(_latest_face_matches.get(camera_id) or [])

    for face in faces:
        face_cx = (face["x1"] + face["x2"]) / 2
        face_cy = (face["y1"] + face["y2"]) / 2
        if detection.x1 <= face_cx <= detection.x2 and detection.y1 <= face_cy <= detection.y2:
            return face["nome"] if face.get("reconhecido") else "Desconhecido"

    return detection.label


def _camera_runtime_key(camera_id, setor: str, source: str) -> str:
    return f"{camera_id if camera_id is not None else setor}:{source or 'frontal'}"


def _get_camera_retry_event(camera_id, setor: str, source: str) -> threading.Event:
    key = _camera_runtime_key(camera_id, setor, source)
    with _camera_retry_lock:
        return _camera_retry_events.setdefault(key, threading.Event())


def _register_camera_retry_event(camera_id, setor: str, source: str) -> threading.Event:
    """Cria e registra o evento de retry EXCLUSIVO de um loop de captura.

    Diferente de _get_camera_retry_event (setdefault), sempre substitui o registro: quando
    um setor reinicia, a thread antiga e a nova disputam a mesma chave, e compartilhar o
    mesmo Event fazia o `finally` da antiga desregistrar o da nova (o botão de reconexão
    manual parava de funcionar)."""
    key = _camera_runtime_key(camera_id, setor, source)
    event = threading.Event()
    with _camera_retry_lock:
        _camera_retry_events[key] = event
    return event


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
            rotation = payload.get("rotation")
            cfg = await asyncio.to_thread(
                config_server.set_analise_config, setor, epis, raw_camera_id, None, rotation
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
        # tolerância de ponto flutuante: x + largura pode dar 100.00000000000001 quando o
        # retângulo encosta na borda (o frontend converte pixels do container → % do frame)
        _eps = 1e-6
        if (box_width <= 0 or box_height <= 0 or min(x, y) < -_eps
                or x + box_width > 100 + _eps or y + box_height > 100 + _eps):
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
def _resolve_sectors() -> dict[str, list[dict]] | None:
    """Agrupa câmeras cadastradas por setor. Sem câmeras → setor 'default' vazio.
    Retorna None se o backend não respondeu — quem chama deve manter o estado atual
    (falha transitória de rede não pode derrubar os pipelines ativos)."""
    try:
        resp = requests.get(CAMERAS_API_URL, timeout=2)
        resp.raise_for_status()
        cameras = resp.json().get("data", [])
    except Exception as e:
        print(f"[SETORES] Não foi possível buscar câmeras: {e} — mantendo setores atuais.")
        return None

    if not cameras:
        return {"default": []}

    sectors: dict[str, list[dict]] = {}
    for cam in cameras:
        s = cam.get("setor") or "default"
        sectors.setdefault(s, []).append(cam)
    return sectors


# Sentinela: o backend não respondeu — o capture loop deve manter a câmera atual como está.
_KEEP_SOURCE = object()


def _make_resolve_fn(setor: str, papel: str, env_var: str | None = None, default=None):
    """Retorna uma função que resolve a URL atual da câmera com o papel dado no setor.
    Devolve _KEEP_SOURCE se o backend estiver indisponível (não reconectar à toa)."""
    def resolve():
        if env_var:
            val = os.environ.get(env_var)
            if val is not None:
                return int(val) if val.isdigit() else (val or default)
        try:
            resp = requests.get(CAMERAS_API_URL, timeout=2)
            resp.raise_for_status()
            cameras = resp.json().get("data", [])
        except Exception:
            return _KEEP_SOURCE
        sector_cams = [c for c in cameras if (c.get("setor") or "default") == setor]
        cam = next((c for c in sector_cams if c.get("papel") == papel), None)
        if cam:
            return cam["streamUrl"]
        return default
    return resolve


def _make_camera_resolve_fn(camera_id):
    """Resolve a câmera pelo ID, mesmo quando outras compartilham setor e papel."""
    def resolve():
        try:
            response = requests.get(CAMERAS_API_URL, timeout=2)
            response.raise_for_status()
            cameras = response.json().get("data", [])
        except Exception:
            return _KEEP_SOURCE
        camera = next((item for item in cameras if str(item.get("id")) == str(camera_id)), None)
        return camera.get("streamUrl") if camera else None
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
    last_frame_sent_at = 0.0
    retry_event = _register_camera_retry_event(camera_id, setor, source)

    # Reconexão automática com backoff exponencial (1, 2, 4, 8s... até
    # RECHECK_CAMERA_INTERVAL_S), tudo dentro desta mesma thread — não cria outros loops
    # e não bloqueia as demais câmeras (cada câmera tem sua própria thread de captura).
    failures = 0
    next_attempt_at = 0.0
    last_status = None

    def _status(status, reason=None):
        # só notifica quando o estado muda (evita repetir "offline" a cada tentativa)
        nonlocal last_status
        if last_status == (status, reason):
            return
        last_status = (status, reason)
        send_stream_status(camera_id, setor, source, status, reason)

    def _schedule_retry():
        nonlocal failures, next_attempt_at
        failures += 1
        next_attempt_at = time.time() + min(RECHECK_CAMERA_INTERVAL_S, 2 ** min(failures - 1, 4))

    def _release_camera():
        nonlocal camera
        if camera is not None:
            try:
                camera.release()
            except Exception:
                pass
            camera = None

    def _drop_camera(reason, message):
        # stream caiu (leitura falhou / parou): libera o handle e agenda nova tentativa
        print(f"[CAMERA] {label}: {message}")
        _release_camera()
        _status("offline", reason)
        _schedule_retry()

    def _reconnect(new_source):
        nonlocal camera, current_source, failures, next_attempt_at
        _release_camera()
        if new_source is None:
            current_source = None
            _status("offline", "origem_nao_configurada")
            _schedule_retry()
            return
        try:
            camera = Camera(source=new_source)
            if stop_event and stop_event.is_set():
                _release_camera()
                return
            camera.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, max_width or 640)
            camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            current_source = new_source
            failures = 0
            next_attempt_at = 0.0
            print(f"[CAMERA] {label}: conectado em {new_source}")
            _status("online")
        except Exception as e:
            print(f"[CAMERA] {label}: falha ao abrir {new_source} ({e})")
            _release_camera()
            current_source = None  # sem fonte ativa → o backoff força nova tentativa
            _status("offline", "falha_ao_abrir")
            _schedule_retry()

    try:
        while not (stop_event and stop_event.is_set()):
            now = time.time()
            retry_requested = retry_event.is_set()
            if retry_requested:
                # pedido manual: tenta já, sem esperar o backoff, e sempre reporta o resultado
                retry_event.clear()
                failures = 0
                next_attempt_at = 0.0
                last_status = None
            offline_retry_due = camera is None and now >= next_attempt_at
            periodic_check = camera is not None and now - last_check >= RECHECK_CAMERA_INTERVAL_S
            if retry_requested or offline_retry_due or periodic_check:
                last_check = now
                new_source = resolve_source_fn()
                if new_source is _KEEP_SOURCE:
                    # Backend indisponível (falha transitória de rede): não dá para saber a fonte
                    # agora. Câmera conectada → mantém como está (não reconecta à toa); offline →
                    # não há o que tentar, então só agenda a próxima tentativa (backoff).
                    if camera is None:
                        _status("offline", "backend_indisponivel")
                        _schedule_retry()
                    elif retry_requested:
                        _status("online")  # o pedido manual não fez nada: desfaz o "reconectando"
                elif retry_requested or camera is None or new_source != current_source:
                    if retry_requested:
                        print(f"[CAMERA] {label}: nova tentativa solicitada pelo usuário.")
                    elif camera is not None:
                        print(f"[CAMERA] {label}: cadastro mudou ({current_source} → {new_source}), reconectando...")
                    else:
                        print(f"[CAMERA] {label}: tentando reconectar (falhas seguidas até aqui: {failures})...")
                    _reconnect(new_source)

            if camera is not None and not camera.is_opened():
                _drop_camera("stream_parou", "stream parou; nova tentativa automática agendada.")
                continue

            if camera is None:
                time.sleep(0.5)
                continue

            ret, frame = camera.read()
            if stop_event and stop_event.is_set():
                break
            if not ret:
                _drop_camera("falha_de_leitura", "leitura falhou; nova tentativa automática agendada.")
                continue

            rotation = config_server.camera_rotation(setor, camera_id)
            if rotation in _ROTATE_CV2:
                frame = cv2.rotate(frame, _ROTATE_CV2[rotation])

            if max_width and frame.shape[1] > max_width:
                scale = max_width / frame.shape[1]
                frame = cv2.resize(frame, (max_width, int(frame.shape[0] * scale)))

            # Cada câmera publica por conta própria: uma frontal offline não pode
            # impedir o vídeo lateral nem a inferência atrasar a transmissão.
            now_frame = time.monotonic()
            if now_frame - last_frame_sent_at >= 0.1:
                last_frame_sent_at = now_frame
                if camera_id is not None:
                    _camera_frame_shapes[str(camera_id)] = (int(frame.shape[1]), int(frame.shape[0]))
                send_tagged_frame(frame, setor=setor, source=source, camera_id=camera_id)
            if frame_q.full():
                try: frame_q.get_nowait()
                except queue.Empty: pass
            frame_q.put(frame)
    finally:
        _release_camera()
        # Só desregistra/avisa se o registro ainda é DESTE loop. Se o setor reiniciou e uma
        # thread nova já assumiu a chave, ela é quem manda no estado e no botão de reconexão.
        with _camera_retry_lock:
            key = _camera_runtime_key(camera_id, setor, source)
            owns_registry = _camera_retry_events.get(key) is retry_event
            if owns_registry:
                _camera_retry_events.pop(key, None)
        if owns_registry:
            send_stream_status(camera_id, setor, source, "offline", "captura_encerrada")


# ── Pipeline de setor ──────────────────────────────────────────────────────────
def _run_sector(
    setor:          str,
    cameras:        list[dict],
    models:         dict,
    inference_lock: threading.Lock,
    zone_checker:   ZoneChecker,
    stop_event:     threading.Event,
):
    capture_threads = []
    try:
        _run_sector_pipeline(
            setor, cameras, models, inference_lock, zone_checker, stop_event, capture_threads,
        )
    finally:
        stop_event.set()
        # Só considera o setor encerrado depois que TODOS os handles fecharem.
        # open/read pode levar 8s; join de 3s deixava a captura antiga viva.
        for thread in capture_threads:
            thread.join()
        print(f"[SETOR] '{setor}': pipeline encerrado.")


def _build_incident_evidence(views, pose_observations, epi_detector, pose_model,
                             pose_analyzer, inference_lock, zone_checker,
                             confirmed_zone_ids, ergo_confirmed):
    """Monta imagens e detalhes usando um único instante por câmera."""
    def run_pose(snapshot):
        with inference_lock:
            raw = pose_model(snapshot, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
        return raw, pose_analyzer.analyze_from_results(raw)

    evidence = {}
    confirmed_epi = []
    confirmed_epi_cameras = []
    zones = []
    for view in views:
        source = view["source"]
        observation = synchronize_incident_view(
            epi_observation=view["epi_observation"],
            pose_observation=pose_observations.get(source),
            current_frame=view["frame"], prefer_epi=bool(view["confirmed_epi"]),
            epi_enabled=view["epi_prefixes"] != [], pose_enabled=view["pose_enabled"],
            run_epi=lambda snapshot: epi_detector.run(snapshot, inference_lock),
            run_pose=run_pose,
        )
        prefixes = view["epi_prefixes"]
        observation["detections"] = [
            d for d in observation["detections"] if d.label.startswith("PESSOA")
            or prefixes is None or any(d.label.startswith(prefix) for prefix in prefixes)
        ]
        observation.update({key: view[key] for key in ("slot", "source", "camera_id")})
        evidence[source] = observation
        confirmed_labels = {d.label for d in view["confirmed_epi"]}
        view_confirmed_epi = [d for d in observation["detections"] if d.label in confirmed_labels]
        confirmed_epi.extend(view_confirmed_epi)
        if view_confirmed_epi:
            confirmed_epi_cameras.append(view["camera_id"])

        zone_id = view["zone_id"]
        zone_config = zone_checker.get(zone_id)
        if zone_id in confirmed_zone_ids and zone_config and observation["raw"] is not None:
            _, people_in_zone = zone_checker.check_from_results(zone_id, observation["raw"])
            for person in people_in_zone:
                if person.get("invadiu"):
                    zones.append({**person, **zone_config, "source": source,
                                  "camera_id": view["camera_id"], "zone_id": zone_id,
                                  "epi_available": prefixes != [] and "epi" not in observation["analysis_errors"],
                                  "epi_labels": {d.label for d in observation["detections"]}})

    people_frontal = evidence.get("frontal", {}).get("people", [])
    people_lateral = evidence.get("lateral", {}).get("people", [])
    verdict_people = (_merge_pose_readings(people_frontal, people_lateral)
                      if CAMERA_DUAL_MODE == "mesma_pessoa" else people_frontal + people_lateral)
    verdict = _aggregate(
        confirmed_epi, verdict_people if ergo_confirmed else [], zones,
        epi_dets=[d for observation in evidence.values() for d in observation["detections"]],
    )
    camera_ids = {source: observation["camera_id"] for source, observation in evidence.items()}
    tracking = build_incident_tracking(people_frontal, people_lateral, camera_ids)
    details = {
        "status": verdict.status,
        "image_source": views[0]["source"],
        "frames": {
            observation["slot"]: {
                "source": source, "camera_id": observation["camera_id"],
                "width": int(observation["frame"].shape[1]),
                "height": int(observation["frame"].shape[0]),
                "sampled_at": observation["sampled_at"],
                "analysis_errors": observation["analysis_errors"],
            }
            for source, observation in evidence.items()
        },
        "tracking": tracking,
        "epi": [
            # O cache facial é de outro instante e não identifica o snapshot desta
            # evidência. Mantém PESSOA para evitar associar o rosto de alguém que se moveu.
            {"label": d.label,
             "confidence": round(float(d.confidence), 4),
             "bbox": [int(d.x1), int(d.y1), int(d.x2), int(d.y2)],
             "source": source, "camera_id": observation["camera_id"]}
            for source, observation in evidence.items() for d in observation["detections"]
        ],
        "ergonomia": [person for people in tracking.values() for person in people],
        "zona": [
            {"pessoa_id": person.get("pessoa_id"), "invadiu": True,
             "nome": person.get("nome", "Zona de Risco"), "pontos": person.get("pontos", []),
             "source": person["source"], "camera_id": person["camera_id"],
             "epis_ausentes": [label for label in person.get("epis_certo_labels", [])
                               if person["epi_available"] and label not in person["epi_labels"]]}
            for person in zones
        ],
        "zona_config": {key: zones[0].get(key) for key in ("nome", "pontos", "source", "camera_id")}
                       if zones else None,
    }
    incident_camera_id = (zones[0]["camera_id"] if zones else
                          confirmed_epi_cameras[0] if confirmed_epi_cameras else
                          next((observation["camera_id"] for observation in evidence.values()
                                if ergo_confirmed and any(_pessoa_em_risco_ergo(person)
                                                          for person in observation["people"])),
                               views[0]["camera_id"]))
    return {"views": evidence, "details": details, "verdict": verdict, "zones": zones,
            "camera_id": incident_camera_id,
            "confirmed_epi": confirmed_epi}


def _persist_incident_job(job, models, inference_lock, stop_event):
    """Só o worker chama modelos complementares e prepara o registro no banco."""
    if stop_event.is_set():
        return
    zone_snapshot = ZoneChecker(model_path=None)
    for zone_id, config in job["zone_configs"].items():
        zone_snapshot.configure(
            zone_id, config["nome"], config["pontos"],
            epis_obrigatorios=config.get("epis_obrigatorios", []),
            epis_certo_labels=config.get("epis_certo_labels", []),
        )
    evidence = _build_incident_evidence(
        job["views"], job["pose_observations"], models["epi_detector"], models["pose_model"],
        models["pose_analyzer"], inference_lock, zone_snapshot,
        job["confirmed_zone_ids"], job["ergo_confirmed"],
    )
    if stop_event.is_set() or not evidence["verdict"].reasons:
        return
    images = {}
    for observation in evidence["views"].values():
        ok, buffer = cv2.imencode(".jpg", observation["frame"], [cv2.IMWRITE_JPEG_QUALITY, 70])
        if not ok:
            raise RuntimeError("Não foi possível codificar a imagem do incidente")
        images[observation["slot"]] = base64.b64encode(buffer).decode("utf-8")
    verdict = evidence["verdict"]
    payload = {
        "timestamp": job["timestamp"], "label": ", ".join(verdict.reasons),
        "confidence": verdict.confidence, "img_Frame": images["frontal"],
        "source": ", ".join(verdict.sources), "camera_id": evidence["camera_id"],
        "setor": job["setor"], "details": evidence["details"],
    }
    if "lateral" in images:
        payload["img_Frame_lateral"] = images["lateral"]
    if not stop_event.is_set():
        _post_queue.put(payload)


def _run_sector_pipeline(
    setor, cameras, models, inference_lock, zone_checker, stop_event, capture_threads,
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
        resolve_frontal = _make_camera_resolve_fn(primary_camera_id)
        resolve_lateral = _make_camera_resolve_fn(lateral_camera_id)

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
    capture_threads.append(t_frontal)
    if t_lateral is not None:
        t_lateral.start()
        capture_threads.append(t_lateral)

    epi_debouncer   = IncidentDebouncer(required_frames=FRAMES_EPI,  cooldown_frames=COOLDOWN_EPI)
    epi_debouncer_lateral = IncidentDebouncer(required_frames=FRAMES_EPI, cooldown_frames=COOLDOWN_EPI)
    ergo_debouncer  = SimpleDebouncer(required_frames=FRAMES_ERGO, cooldown_frames=COOLDOWN_ERGO)
    zona_debouncers = {
        zone_id: SimpleDebouncer(required_frames=FRAMES_ZONA, cooldown_frames=COOLDOWN_ZONA)
        for zone_id in zone_camera_ids
    }
    queda_debouncer = SimpleDebouncer(required_frames=6, cooldown_frames=120)
    _last_verdict_key = None
    _last_verdict_t   = 0.0
    _last_metrics_t   = 0.0

    _epi_state         = {"counter": 0, "observation": None, "running": False}
    _epi_state_lateral = {"counter": 0, "observation": None, "running": False}
    _empty_pose_result = {"raw": None, "raw_frontal": None, "raw_lateral": None,
                          "lat_ms": 0.0, "pck": None, "views": {},
                          "pessoas": [], "pessoas_frontal": [], "pessoas_lateral": []}
    _pose_state = {
        "counter": 0, "result": _empty_pose_result,
        "running": False,
    }
    last_sent_pose_result = None
    _verdict_cooldown = 0

    configured_zone_ids = [zone_id for zone_id in zone_camera_ids if zone_checker.get(zone_id)]
    print(f"[CAMERA] {primary_camera_id}: pipeline ativo | setor='{setor}' | "
          f"source={primary_source} | cameras_zona={zone_camera_ids} | "
          f"segunda_captura={'sim' if t_lateral is not None else 'não'} | "
          f"zonas_configuradas={configured_zone_ids or 'nenhuma'}")

    incident_worker = IncidentEvidenceWorker(
        lambda job: _persist_incident_job(job, models, inference_lock, stop_event),
        max_pending=8, name=f"incident-camera-{primary_camera_id or setor}",
        on_error=lambda error: print(
            f"[INCIDENTE] {setor}/câmera {primary_camera_id}: falha ao processar evidência: {error}"
        ),
    )
    incident_worker.start()

    try:
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

            if primary_camera_id is not None:
                with _latest_frontal_frames_lock:
                    _latest_frontal_frames[primary_camera_id] = frame

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

            # 1. EPI — background, a cada 5 frames, com lock de inferência
            # _prefixes=None → detecta tudo; _prefixes=[] → pula EPI (nenhum configurado)
            _primary_prefixes = epi_prefixes_ativos(setor, primary_camera_id)
            _ergonomia_ativa = ergonomia_ativa(setor, primary_camera_id)
            _lateral_prefixes = epi_prefixes_ativos(setor, lateral_camera_id) if has_lateral else []
            queda_ativa = "QUEDA" in (_primary_prefixes or []) or "QUEDA" in (_lateral_prefixes or [])
            if _primary_prefixes != []:
                # EPI na câmera frontal
                _epi_state["counter"] += 1
                if _epi_state["counter"] >= 5 and not _epi_state["running"]:
                    _epi_state["counter"]  = 0
                    _epi_state["running"]  = True
                    _frame_snap = frame.copy()
                    _sampled_at = datetime.now().isoformat()
                    def _epi_bg(snap=_frame_snap, sampled_at=_sampled_at):
                        try:
                            # o detector só segura o lock na inferência local (não durante o HTTP do Roboflow)
                            detections = epi_detector.run(snap, inference_lock)
                            _epi_state["observation"] = {
                                "frame": snap, "detections": detections, "sampled_at": sampled_at,
                            }
                        except Exception as e:
                            print(f"[EPI] {setor}: falha na inferência: {e}")
                        finally:
                            _epi_state["running"] = False
                    threading.Thread(target=_epi_bg, daemon=True).start()

            else:
                _epi_state["observation"] = None

            # EPI na câmera lateral (quando disponível) — configuração independente
            if has_lateral and _lateral_prefixes != []:
                    _epi_state_lateral["counter"] += 1
                    if _epi_state_lateral["counter"] >= 5 and not _epi_state_lateral["running"]:
                        _epi_state_lateral["counter"] = 0
                        _epi_state_lateral["running"] = True
                        _frame_lat_snap = _last_lateral_frame["frame"].copy()
                        _sampled_at_lat = datetime.now().isoformat()
                        def _epi_lat_bg(snap=_frame_lat_snap, sampled_at=_sampled_at_lat):
                            try:
                                detections = epi_detector.run(snap, inference_lock)
                                _epi_state_lateral["observation"] = {
                                    "frame": snap, "detections": detections, "sampled_at": sampled_at,
                                }
                            except Exception as e:
                                print(f"[EPI] {setor}/lateral: falha na inferência: {e}")
                            finally:
                                _epi_state_lateral["running"] = False
                        threading.Thread(target=_epi_lat_bg, daemon=True).start()
            else:
                _epi_state_lateral["observation"] = None

            def _filter_epi(detections, prefixes):
                return [d for d in detections if d.label.startswith("PESSOA")
                        or prefixes is None
                        or any(d.label.startswith(prefix) for prefix in prefixes)]

            primary_epi_observation = _epi_state["observation"]
            lateral_epi_observation = _epi_state_lateral["observation"] if has_lateral else None
            primary_epi_dets = _filter_epi(
                primary_epi_observation["detections"] if primary_epi_observation else [], _primary_prefixes,
            )
            lateral_epi_dets = _filter_epi(
                lateral_epi_observation["detections"] if lateral_epi_observation else [], _lateral_prefixes,
            ) if has_lateral else []
            epi_dets = primary_epi_dets + lateral_epi_dets

            epi_incidents  = epi_detector.incidents(epi_dets)
            primary_epi_confirmed = epi_debouncer.update(epi_detector.incidents(primary_epi_dets), primary_epi_dets)
            lateral_epi_confirmed = epi_debouncer_lateral.update(epi_detector.incidents(lateral_epi_dets), lateral_epi_dets)
            epi_confirmed = primary_epi_confirmed + lateral_epi_confirmed
            conf_media_epi = (
                round(sum(d.confidence for d in epi_dets) / len(epi_dets), 4)
                if epi_dets else None
            )

            # 2. Pose também localiza pessoas nas zonas e detecta queda, mesmo
            # quando a análise ergonômica desta câmera estiver desativada.
            zona_ativa_no_setor = any(zone_checker.get(zone_id) for zone_id in zone_camera_ids)
            if _ergonomia_ativa or zona_ativa_no_setor or queda_ativa:
                _pose_state["counter"] += 1
                if _pose_state["counter"] >= 2 and not _pose_state["running"]:
                    _pose_state["counter"] = 0
                    _pose_state["running"] = True
                    _snap_pose     = frame_pose.copy()
                    _snap_frontal  = frame.copy() if has_lateral else None
                    _dual          = has_lateral
                    _pose_sampled_at = datetime.now().isoformat()

                    def _pose_bg(snap_pose=_snap_pose, snap_frontal=_snap_frontal, _has_lat=_dual,
                                 sampled_at=_pose_sampled_at):
                        try:
                            with inference_lock:
                                raw_lat = pose_model(snap_pose, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
                            pessoas_lat = pose_analyzer.analyze_from_results(raw_lat)

                            if _has_lat and snap_frontal is not None:
                                with inference_lock:
                                    raw_front = pose_model(snap_frontal, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
                                pessoas_front = pose_analyzer.analyze_from_results(raw_front)
                                result = {
                                    "pessoas_frontal": pessoas_front, "pessoas_lateral": pessoas_lat,
                                    "raw_frontal": raw_front, "raw_lateral": raw_lat,
                                    "views": {
                                        primary_source: {"frame": snap_frontal, "raw": raw_front,
                                                         "people": pessoas_front, "sampled_at": sampled_at},
                                        "lateral": {"frame": snap_pose, "raw": raw_lat,
                                                    "people": pessoas_lat, "sampled_at": sampled_at},
                                    },
                                }
                                if CAMERA_DUAL_MODE == "mesma_pessoa":
                                    result["pessoas"] = _merge_pose_readings(pessoas_front, pessoas_lat)
                                else:
                                    result["pessoas"] = pessoas_front + pessoas_lat
                            else:
                                result = {
                                    "pessoas_frontal": pessoas_lat, "pessoas_lateral": [],
                                    "pessoas": pessoas_lat, "raw_frontal": raw_lat, "raw_lateral": None,
                                    "views": {primary_source: {"frame": snap_pose, "raw": raw_lat,
                                                              "people": pessoas_lat, "sampled_at": sampled_at}},
                                }

                            result["raw"] = raw_lat
                            result["lat_ms"] = raw_lat[0].speed.get("inference", 0.0)
                            result["pck"] = _calc_pck(raw_lat)
                            # Publica todas as vistas e seus snapshots juntas. O leitor nunca
                            # combina a pose frontal nova com a lateral do ciclo anterior.
                            _pose_state["result"] = result
                        finally:
                            _pose_state["running"] = False

                    threading.Thread(target=_pose_bg, daemon=True).start()
            else:
                _pose_state.update({
                    "result": _empty_pose_result,
                })

            pose_result = _pose_state["result"]
            raw_pose    = pose_result["raw"]
            lat_pose_ms = pose_result["lat_ms"]
            pck_pose    = pose_result["pck"]
            ergo_pessoas = pose_result["pessoas"]

            ergo_em_risco  = [p for p in ergo_pessoas if _pessoa_em_risco_ergo(p)] if _ergonomia_ativa else []
            ergo_confirmed = ergo_debouncer.update(len(ergo_em_risco) > 0)

            # "queda" é só mais uma chave no mesmo mecanismo de toggle dos EPIs (config_server.
            # EPI_KEY_TO_PREFIX) — reaproveita _primary_prefixes/_lateral_prefixes já calculados
            # acima, sem lógica paralela de ativação.
            queda_detectada = queda_ativa and any(p.get("queda", False) for p in ergo_pessoas)
            queda_confirmed = queda_debouncer.update(queda_detectada)

            zone_inputs = [(primary_zone_id, pose_result["raw_frontal"], primary_source, primary_camera_id)]
            if has_lateral and lateral_zone_id and lateral_zone_id != primary_zone_id:
                zone_inputs.append((lateral_zone_id, pose_result["raw_lateral"], "lateral", lateral_camera_id))

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
                print("[REALTIME] send_verdict", live_verdict)
                _send_verdict(live_verdict, setor=setor, camera_id=primary_camera_id, source=primary_source)

            # 4.5 Queda — checagem explícita antes do envio, além do gate já aplicado acima.
            # Mesmo ponto de decisão usado pro envio: beep só dispara se a label "Queda"
            # estiver ativa pra essa câmera/setor (Problema 1) e o latch confirmou (Problema 2).
            print(
                "[REALTIME][DEBUG] epi_confirmed=", epi_confirmed,
                "ergo_confirmed=", ergo_confirmed,
                "zona_confirmed=", zona_confirmed,
                "queda_confirmed=", queda_confirmed,
                "queda_ativa=", queda_ativa,
            )
            if queda_confirmed and queda_ativa:
                print("[REALTIME] beep (queda)")
                threading.Thread(target=_beep, daemon=True).start()
                print("[REALTIME] send_queda")
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
            print("[REALTIME] send_detections", len(primary_missing_epi))
            send_detections(
                [{"label": d.label, "confidence": round(float(d.confidence), 4),
                  "x1": int(d.x1), "y1": int(d.y1), "x2": int(d.x2), "y2": int(d.y2)}
                 for d in primary_missing_epi],
                setor=setor, source=primary_source, camera_id=primary_camera_id,
            )
            if has_lateral:
                print("[REALTIME] send_detections", len(lateral_missing_epi))
                send_detections(
                    [{"label": d.label, "confidence": round(float(d.confidence), 4),
                      "x1": int(d.x1), "y1": int(d.y1), "x2": int(d.x2), "y2": int(d.y2)}
                     for d in lateral_missing_epi],
                    setor=setor, source="lateral", camera_id=lateral_camera_id,
                )
            if pose_result is not last_sent_pose_result:
                last_sent_pose_result = pose_result
                if has_frontal_cam:
                    send_pose(pose_result["pessoas_frontal"], source="frontal", setor=setor, camera_id=primary_camera_id)
                    if has_lateral:
                        send_pose(pose_result["pessoas_lateral"], source="lateral", setor=setor, camera_id=lateral_camera_id)
                else:
                    send_pose(pose_result["pessoas_frontal"], source=primary_source, setor=setor, camera_id=primary_camera_id)

            # 6. Incident confirmado → beep + banco
            print(
                "[REALTIME][DEBUG bloco 6] epi_confirmed=", epi_confirmed,
                "ergo_confirmed=", ergo_confirmed,
                "zona_confirmed=", zona_confirmed,
                "queda_confirmed=", queda_confirmed,
                "queda_ativa=", queda_ativa,
            )
            if epi_confirmed or ergo_confirmed or zona_confirmed:
                timestamp = datetime.now().isoformat()
                for source, camera_id, detections in (
                    (primary_source, primary_camera_id, primary_epi_confirmed),
                    ("lateral", lateral_camera_id, lateral_epi_confirmed),
                ):
                    for detection in detections:
                        send_alert(
                            label=detection.label, confidence=round(float(detection.confidence), 4),
                            timestamp=timestamp, setor=setor, camera_id=camera_id, source=source,
                        )
                threading.Thread(target=_beep, daemon=True).start()

                views = [{
                    "slot": "frontal", "source": primary_source, "camera_id": primary_camera_id,
                    "zone_id": primary_zone_id, "frame": frame,
                    "epi_observation": primary_epi_observation,
                    "confirmed_epi": primary_epi_confirmed, "epi_prefixes": _primary_prefixes,
                    "pose_enabled": _ergonomia_ativa or queda_ativa or zone_checker.get(primary_zone_id) is not None,
                }]
                if has_lateral and has_frontal_cam:
                    views.append({
                        "slot": "lateral", "source": "lateral", "camera_id": lateral_camera_id,
                        "zone_id": lateral_zone_id, "frame": frame_pose,
                        "epi_observation": lateral_epi_observation,
                        "confirmed_epi": lateral_epi_confirmed, "epi_prefixes": _lateral_prefixes,
                        "pose_enabled": _ergonomia_ativa or queda_ativa or zone_checker.get(lateral_zone_id) is not None,
                    })
                zone_configs = {}
                for view in views:
                    zone_config = zone_checker.get(view["zone_id"])
                    if zone_config is not None:
                        zone_configs[view["zone_id"]] = deepcopy(zone_config)
                # As observações publicadas não são modificadas pelas próximas inferências.
                # O job guarda esses snapshots, as configurações e o instante da confirmação.
                job = {
                    "views": views, "pose_observations": dict(pose_result["views"]),
                    "confirmed_zone_ids": frozenset(person["zone_id"] for person in zona_confirmadas),
                    "zone_configs": zone_configs, "ergo_confirmed": ergo_confirmed,
                    "timestamp": timestamp, "setor": setor,
                }
                if not incident_worker.submit(job) and not stop_event.is_set():
                    print(
                        f"[INCIDENTE] {setor}/câmera {primary_camera_id}: fila de evidências cheia "
                        "(8 pendentes); evento não salvo. O alerta ao vivo já foi emitido."
                    )

            # 7. Métricas (a cada 0.5s para não sobrecarregar o WebSocket)
            if _now_t - _last_metrics_t >= 0.5:
                _last_metrics_t = _now_t
                lat_total_ms = (time.perf_counter() - t_start) * 1000
                _send_metrics(lat_total_ms, 0.0, lat_pose_ms, pck_pose, conf_media_epi, setor=setor, camera_id=primary_camera_id, source=primary_source)
    finally:
        incident_worker.stop()

# ── Gerenciador de setores ─────────────────────────────────────────────────────
_active_sectors: dict[str, dict] = {}
_active_sectors_lock = threading.Lock()


def _camera_pipeline_key(setor, cameras):
    if not cameras:
        return "default" if setor == "default" else f"fallback:{setor}"
    if len(cameras) != 1:
        raise ValueError("Cada pipeline cadastrado deve receber exatamente uma câmera")
    return f"camera:{cameras[0]['id']}"


def _camera_pipeline_signature(setor, cameras):
    return frozenset(
        (setor, camera["id"], camera.get("papel") or "frontal", camera.get("streamUrl", ""))
        for camera in cameras
    )


def _camera_pipeline_entries(sectors, include_fallback=True):
    entries = {}
    for setor, cameras in sectors.items():
        if cameras:
            for camera in cameras:
                singleton = [camera]
                entries[_camera_pipeline_key(setor, singleton)] = (setor, singleton)
        elif include_fallback:
            entries[_camera_pipeline_key(setor, [])] = (setor, [])
    return entries


def _sector_manager(models: dict, inference_lock: threading.Lock, zone_checker: ZoneChecker):
    """Setor é uma tag; cada câmera tem captura, análise e persistência próprias."""
    while True:
        sectors = _resolve_sectors()
        if sectors is None:
            time.sleep(SECTOR_CHECK_INTERVAL_S)
            continue
        desired = _camera_pipeline_entries(sectors)

        with _active_sectors_lock:
            for key, (setor, cameras) in desired.items():
                existing = _active_sectors.get(key)
                signature = _camera_pipeline_signature(setor, cameras)
                if existing is None:
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)
                elif existing["cam_ids"] != signature:
                    if not existing["stop_event"].is_set():
                        print(f"[CAMERA] {key}: cadastro alterado; encerrando somente esta câmera.")
                    existing["stop_event"].set()
                    # Não espera o timeout RTSP aqui: as outras câmeras seguem e podem iniciar.
                    if existing["thread"].is_alive():
                        continue
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)
                elif not existing["thread"].is_alive():
                    _start_sector(setor, cameras, models, inference_lock, zone_checker)

            for key in list(_active_sectors):
                if key not in desired:
                    existing = _active_sectors[key]
                    if not existing["stop_event"].is_set():
                        print(f"[CAMERA] {key}: removida do cadastro; encerrando somente esta câmera.")
                    existing["stop_event"].set()
                    if not existing["thread"].is_alive():
                        del _active_sectors[key]
        time.sleep(SECTOR_CHECK_INTERVAL_S)


def _start_sector(setor: str, cameras: list[dict], models: dict, inference_lock: threading.Lock, zone_checker: ZoneChecker):
    key = _camera_pipeline_key(setor, cameras)
    stop_event = threading.Event()
    thread = threading.Thread(
        target=_run_sector,
        args=(setor, cameras, models, inference_lock, zone_checker, stop_event),
        daemon=True, name=f"pipeline-{key}",
    )
    _active_sectors[key] = {
        "thread": thread, "stop_event": stop_event, "setor": setor,
        "cam_ids": _camera_pipeline_signature(setor, cameras),
    }
    thread.start()
    print(f"[CAMERA] {key}: pipeline independente iniciado | setor='{setor}'.")


# ── Reconhecimento facial ────────────────────────────────────────────────────────
# Pipeline independente do EPI/pose/zona em _run_sector, mas SEM abrir uma 2ª conexão
# de captura: lê o último frame frontal já capturado por _run_sector (_latest_frontal_frames).
# Câmeras de rede baratas (apps tipo IP Webcam) só aguentam um cliente de vídeo por vez —
# abrir uma segunda captura na mesma URL derrubava o feed exibido no frontend sempre que
# este setor iniciava. Roda em intervalo mais espaçado (FACIAL_PROCESS_INTERVAL_S):
# identidade não muda a cada frame como um risco de EPI, não precisa da mesma cadência.
def _run_facial_sector(
    setor:      str,
    cameras:    list[dict],
    stop_event: threading.Event,
    recognizer: FaceRecognizer,
    registry:   FuncionarioFaceRegistry,
):
    cam_frontal = next((c for c in cameras if c.get("papel") == "frontal"), None)
    if cam_frontal is None and cameras:
        cam_frontal = cameras[0]
    if cam_frontal is None:
        print(f"[FACIAL] setor '{setor}': sem câmera disponível, reconhecimento facial não iniciado.")
        return

    camera_id = cam_frontal.get("id")

    # Uma pessoa desconhecida ainda assim precisa de uma chave estável pro debounce não
    # reabrir a cada frame — agrupa pela posição aproximada do rosto (sem tracking real,
    # mesma limitação documentada em IncidentDebouncer).
    debouncers: dict[object, SimpleDebouncer] = {}
    print(f"[FACIAL] setor '{setor}': reconhecimento facial ativo (câmera {camera_id}).")

    while not stop_event.is_set():
        with _latest_frontal_frames_lock:
            frame = _latest_frontal_frames.get(camera_id)

        if frame is None:
            time.sleep(0.5)
            continue

        # NÃO chama registry.refresh_if_needed() aqui — isso roda numa thread própria
        # (_facial_registry_sync_worker). Sincronizar aqui bloquearia este loop (que
        # atualiza a caixa+nome ao vivo) por vários segundos toda vez que precisasse
        # recalcular embeddings (leitura de foto + MTCNN/FaceNet na CPU não é instantâneo),
        # travando a transmissão — foi exatamente isso que causava a demora reportada.
        matches = recognizer.identify(frame, registry.known_embeddings())

        # Transmite a cada ciclo (não só quando o debounce confirma) — é o que faz a
        # caixa + nome acompanhar o rosto ao vivo na tela de Câmeras, no mesmo espírito
        # do send_detections() do EPI. frame_width/height vão junto por segurança (caso
        # source "facial" um dia volte a ter resolução própria) — hoje é o mesmo frame
        # exibido em "frontal", então bate exatamente com o que o overlay já usa.
        face_height, face_width = frame.shape[:2]
        faces_payload = [
            {
                "nome": m.nome,
                "confidence": m.confidence,
                "x1": int(m.x1), "y1": int(m.y1), "x2": int(m.x2), "y2": int(m.y2),
                "funcionario_id": m.funcionario_id,
                "reconhecido": m.reconhecido,
            }
            for m in matches
        ]
        send_faces(
            faces_payload,
            setor=setor, source="facial", camera_id=camera_id,
            frame_width=face_width, frame_height=face_height,
        )
        # Guarda pra _run_sector trocar o label "PESSOA" pelo nome reconhecido ao montar
        # o incidente (ver _resolve_pessoa_label) — mesma câmera, resultado mais recente.
        with _latest_face_matches_lock:
            _latest_face_matches[camera_id] = faces_payload

        for match in matches:
            key = match.funcionario_id if match.reconhecido else f"desconhecido_{round(match.center_x / 80)}_{round(match.center_y / 80)}"
            debouncer = debouncers.setdefault(
                key, SimpleDebouncer(required_frames=FRAMES_FACIAL, cooldown_frames=COOLDOWN_FACIAL)
            )
            if not debouncer.update(True):
                continue

            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            img_b64 = base64.b64encode(buf).decode("utf-8")
            payload = {
                "funcionario_id": match.funcionario_id,
                "nome_detectado": match.nome,
                "confidence": match.confidence,
                "camera_id": camera_id,
                "setor": setor,
                "img_Frame": img_b64,
                "timestamp": datetime.now().isoformat(),
            }
            _facial_post_queue.put(payload)
            print(f"[FACIAL] '{match.nome}' reconhecido em '{setor}' (confiança {match.confidence:.2f}).")

        time.sleep(FACIAL_PROCESS_INTERVAL_S)

    print(f"[FACIAL] setor '{setor}': encerrado.")


# A sincronização do registro (calcular e cachear o embedding de cada funcionário) não
# pode depender de haver uma câmera/setor ativo — senão um cadastro feito antes de
# qualquer câmera existir fica "Aguardando processamento" pra sempre, já que
# _run_facial_sector (e o registry.refresh_if_needed() dentro dele) nunca chega a rodar.
# Esta thread roda por conta própria assim que o orquestrador sobe.
def _facial_registry_sync_worker(registry: FuncionarioFaceRegistry):
    while True:
        registry.refresh_if_needed()
        time.sleep(5)


_active_facial_sectors: dict[str, dict] = {}
_active_facial_sectors_lock = threading.Lock()


def _facial_sector_manager(recognizer: FaceRecognizer, registry: FuncionarioFaceRegistry):
    """Uma thread facial por ID, reutilizando a captura da própria câmera."""
    while True:
        sectors = _resolve_sectors()
        if sectors is not None:
            desired = _camera_pipeline_entries(sectors, include_fallback=False)
            with _active_facial_sectors_lock:
                for key, (setor, cameras) in desired.items():
                    existing = _active_facial_sectors.get(key)
                    signature = _camera_pipeline_signature(setor, cameras)
                    if existing is None:
                        _start_facial_sector(setor, cameras, recognizer, registry)
                    elif existing["cam_ids"] != signature:
                        existing["stop_event"].set()
                        if not existing["thread"].is_alive():
                            _start_facial_sector(setor, cameras, recognizer, registry)
                    elif not existing["thread"].is_alive():
                        _start_facial_sector(setor, cameras, recognizer, registry)

                for key in list(_active_facial_sectors):
                    if key not in desired:
                        existing = _active_facial_sectors[key]
                        existing["stop_event"].set()
                        if not existing["thread"].is_alive():
                            del _active_facial_sectors[key]
        time.sleep(SECTOR_CHECK_INTERVAL_S)


def _start_facial_sector(setor: str, cameras: list[dict], recognizer: FaceRecognizer, registry: FuncionarioFaceRegistry):
    key = _camera_pipeline_key(setor, cameras)
    stop_event = threading.Event()
    thread = threading.Thread(
        target=_run_facial_sector,
        args=(setor, cameras, stop_event, recognizer, registry),
        daemon=True, name=f"facial-{key}",
    )
    _active_facial_sectors[key] = {
        "thread": thread, "stop_event": stop_event, "setor": setor,
        "cam_ids": _camera_pipeline_signature(setor, cameras),
    }
    thread.start()
    print(f"[FACIAL] {key}: reconhecimento independente iniciado | setor='{setor}'.")


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

    # Reconhecimento facial é opcional: se torch/facenet-pytorch não estiverem instalados
    # (ver ml_facial/requirements.txt) ou a GPU/CPU não suportar o modelo, desativa só esta
    # feature — EPI/ergonomia/zona continuam funcionando normalmente.
    try:
        face_recognizer = FaceRecognizer()
        # 15s (em vez do padrão de 30s): agora que a sincronização roda numa thread própria
        # e não trava mais a transmissão ao vivo (ver _facial_registry_sync_worker), dá pra
        # ser mais ágil sem custo — fotos novas cadastradas demoram menos pra "entrar em vigor".
        face_registry = FuncionarioFaceRegistry(
            face_recognizer, backend_url=BACKEND_FUNCIONARIOS_URL, refresh_interval_s=15.0
        )
    except Exception as e:
        print(f"[FACIAL] Reconhecimento facial desativado: {e}")
        face_recognizer = None
        face_registry = None

    if face_recognizer is not None:
        threading.Thread(target=_facial_post_worker, daemon=True).start()
        threading.Thread(
            target=_facial_registry_sync_worker,
            args=(face_registry,),
            daemon=True,
            name="facial-registry-sync",
        ).start()
        threading.Thread(
            target=_facial_sector_manager,
            args=(face_recognizer, face_registry),
            daemon=True,
            name="facial-sector-manager",
        ).start()

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
