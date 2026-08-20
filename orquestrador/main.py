"""
Orquestrador — Pipeline Unificado de Visão Computacional
=========================================================
Captura frames da câmera, distribui para EPIDetector, PoseAnalyzer e
ZoneChecker, combina os resultados em um Verdict e transmite ao frontend
via WebSocket. Corrige todos os bugs documentados em ISSUES_POR_BRANCH.md.
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
    send_frame, send_frame_lateral, send_alert, send_detections, send_pose, start_server_in_thread,
)
import ml_service.streaming.websocket_server as _ws
from core.entities import Detection
from pose_analyzer import PoseAnalyzer
from zone_checker import ZoneChecker
import config_server

# ── Configuração ───────────────────────────────────────────────────────────────
BACKEND_URL        = "http://localhost:3000/api/detections"
BACKEND_ZONAS_URL  = "http://localhost:3000/api/zonas"
CAMERAS_API_URL    = "http://localhost:3000/api/cameras"
CONFIG_SERVER_PORT = 5050

# Câmera frontal (EPI) — índice local (webcam do note) por padrão, se nada mais resolver.
CAMERA_SOURCE         = 0

# Câmera lateral (ergonomia + zona) — 2ª câmera da MESMA unidade de detecção.
# None/"" = câmera única (comportamento antigo, pose roda no frame frontal).
CAMERA_SOURCE_LATERAL = None

# CAMERA_ID identifica a UNIDADE (o par frontal+lateral), não uma câmera isolada —
# as duas câmeras pertencem ao mesmo processo/orquestrador, então não há "matching"
# entre feeds independentes: elas já nascem correlacionadas por rodarem no mesmo loop.
CAMERA_ID          = "cam_01"

# Como tratar frontal+lateral pra fins de ALERTA (risco ergonômico/queda), quando as
# duas estão ativas:
#   "independente" (padrão) — cada câmera é um espaço diferente (ex: quarto + cozinha).
#       Pessoas detectadas nas duas são tratadas como pessoas distintas, sem fundir.
#   "mesma_pessoa" — as duas câmeras veem o MESMO posto/pessoa por ângulos diferentes
#       (ex: uma bancada vista de frente e de lado). Funde por índice de detecção e
#       fica com a leitura de ângulos REBA mais completa (ver _merge_pose_readings).
# Isso só afeta a decisão de alerta — o desenho na tela sempre usa a detecção real de
# cada câmera (ver send_pose com `source`), então nunca aparece gente "fantasma".
CAMERA_DUAL_MODE = os.environ.get("CAMERA_DUAL_MODE", "independente")


def _resolve_camera_sources():
    """Resolve de onde vêm os streams frontal/lateral, nessa ordem de prioridade:
    1) variáveis de ambiente CAMERA_SOURCE / CAMERA_SOURCE_LATERAL (útil pra testar
       localmente sem precisar cadastrar nada no frontend);
    2) câmeras cadastradas em /monitoramento (GET /api/cameras), usando o streamUrl
       de quem tiver papel="frontal" e papel="lateral";
    3) fallback: webcam local (índice 0) só na frontal, sem lateral.

    DISABLE_LATERAL=1 força modo só-frontal mesmo com uma câmera lateral cadastrada
    — útil quando o cadastro existe mas o stream físico não está disponível agora.
    """
    frontal_env = os.environ.get("CAMERA_SOURCE")
    if frontal_env is not None and frontal_env.isdigit():
        frontal_env = int(frontal_env)  # índice de webcam local (ex: "0") — não uma URL
    lateral_env = os.environ.get("CAMERA_SOURCE_LATERAL") or None
    disable_lateral = os.environ.get("DISABLE_LATERAL") == "1"

    cameras = []
    try:
        resp = requests.get(CAMERAS_API_URL, timeout=2)
        resp.raise_for_status()
        cameras = resp.json().get("data", [])
    except Exception as e:
        print(f"[CAMERAS] Não foi possível buscar câmeras cadastradas em {CAMERAS_API_URL} ({e}) — usando padrão/env.")

    cam_frontal = next((c for c in cameras if c.get("papel") == "frontal"), None)
    cam_lateral = next((c for c in cameras if c.get("papel") == "lateral"), None)

    frontal = frontal_env if frontal_env is not None else (cam_frontal["streamUrl"] if cam_frontal else 0)
    lateral = None if disable_lateral else (lateral_env or (cam_lateral["streamUrl"] if cam_lateral else None))
    camera_id = f"cam_{cam_frontal['id']}" if (cam_frontal and frontal_env is None) else "cam_01"

    if cam_frontal or cam_lateral:
        print(f"[CAMERAS] Usando cadastro do frontend — frontal: {cam_frontal['nome'] if cam_frontal else '(nenhuma)'}, "
              f"lateral: {'(desativada via DISABLE_LATERAL)' if disable_lateral else (cam_lateral['nome'] if cam_lateral else '(nenhuma)')}")

    return frontal, lateral, camera_id

# Frames consecutivos necessários para confirmar cada tipo de risco
FRAMES_EPI   = 10
FRAMES_ERGO  = 8
FRAMES_ZONA  = 3
COOLDOWN_EPI  = 60
COOLDOWN_ERGO = 60
COOLDOWN_ZONA = 30

# Limiar REBA para considerar risco ergonômico (inclusive)
REBA_RISCO_MINIMO = 4   # MÉDIO = 4–7, ALTO = 8–15

# Confiança mínima pra aceitar uma detecção do yolov8n-pose como "pessoa". O modelo
# só tem essa classe, mas é o menor/menos preciso da família — sem esse limiar,
# uma silhueta parecida (ex: um cachorro em certa pose) pode passar como pessoa
# de baixa confiança e entrar na análise de ergonomia.
POSE_CONF_MINIMO = 0.5

# imgsz usado em toda chamada aos modelos de pose/EPI — precisa ser o MESMO valor
# usado ao exportar o .engine (TensorRT), já que um engine é compilado pra um
# tamanho de entrada fixo. Mudar aqui sem re-exportar quebra a inferência.
MODEL_IMGSZ = 320


# ── Verdict ────────────────────────────────────────────────────────────────────
@dataclass
class Verdict:
    status: str                          # MONITORANDO | ALERTA | ALERTA_CRITICO | ALERTA_MULTIPLO
    reasons: list[str]                   # labels que causaram o alerta
    confidence: float
    sources: list[str]                   # quais módulos dispararam: epi, ergonomia, zona
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


# ── Debouncer simples (para ergonomia e zona) ──────────────────────────────────
class SimpleDebouncer:
    """Confirma um risco binário após N frames consecutivos."""

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
    """Retorna True se o score REBA da pessoa indica risco MÉDIO ou ALTO."""
    return p.get("reba_score", 1) >= REBA_RISCO_MINIMO


def _reba_reason(p: dict) -> str:
    """Label legível para incluir no Verdict."""
    return f"ergonomia_reba_{p.get('reba_level', 'DESCONHECIDO').lower()}_{p.get('reba_score', 0)}"


def _pose_completude(pessoa: dict) -> int:
    """Quantos ângulos REBA foram calculados de verdade (mais = leitura mais confiável)."""
    return len(pessoa.get("angulos", {}))


def _merge_pose_readings(pessoas_a: list[dict], pessoas_b: list[dict]) -> list[dict]:
    """
    Combina a leitura de ergonomia das duas câmeras da mesma unidade.

    A pessoa vira naturalmente durante o dia — em um dado momento pode estar de
    perfil pra câmera frontal e de frente pra lateral (ou vice-versa). Uma vista
    de frente é ambígua pro REBA (não dá pra medir flexão de tronco/pescoço direito),
    então em vez de fixar numa câmera só, pareamos por índice de detecção e ficamos
    com a leitura que tem mais ângulos calculados — ou seja, a câmera que no
    momento está vendo a pessoa de um ângulo utilizável.
    """
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


# ── Parse EPI sem segunda inferência (corrige Bug #1) ─────────────────────────
def _parse_epi(raw_results, names: dict) -> list[Detection]:
    """Transforma o resultado bruto do YOLO em lista de Detection sem rodar o modelo de novo."""
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

    # Labels de todas as detecções EPI do frame (para cruzar com EPIs obrigatórios da zona)
    all_epi_labels = {d.label for d in (epi_dets or epi_confirmed)}

    for d in epi_confirmed:
        reasons.append(d.label)
        confidences.append(float(d.confidence))
        if "epi" not in sources:
            sources.append("epi")

    # ── REBA: substitui p["classe"] != "adequada" ──────────────────────────
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
            # Verifica EPIs obrigatórios da zona contra detecções do frame atual
            epis_certo = p.get("epis_certo_labels", [])
            epis_obrig = p.get("epis_obrigatorios", [])
            for epi_id, epi_label in zip(epis_obrig, epis_certo):
                if epi_label not in all_epi_labels:
                    reasons.append(f"zona_epi_ausente_{epi_id}")
                    confidences.append(1.0)

    if not reasons:
        return Verdict(status="MONITORANDO", reasons=[], confidence=0.0, sources=[])

    avg_conf = round(sum(confidences) / len(confidences), 4)

    # ALTO (8–15) equivale ao antigo "risco_imediato"
    is_critico = any(
        p.get("reba_level") == "ALTO" for p in ergo_pessoas
    ) or any(r == "zona_perigo" for r in reasons)

    if len(sources) > 1:
        status = "ALERTA_MULTIPLO"
    elif is_critico:
        status = "ALERTA_CRITICO"
    else:
        status = "ALERTA"

    return Verdict(status=status, reasons=reasons, confidence=avg_conf, sources=sources)


# ── WebSocket: envia veredicto completo ───────────────────────────────────────
def _send_verdict(verdict: Verdict):
    if not _ws._loop or not _ws.CONNECTED_CLIENTS:
        return
    msg = json.dumps({
        "type":       "verdict",
        "status":     verdict.status,
        "reasons":    verdict.reasons,
        "confidence": verdict.confidence,
        "sources":    verdict.sources,
        "timestamp":  verdict.timestamp,
    })
    async def _broadcast():
        for client in list(_ws.CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                _ws.CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _ws._loop)


# ── Métricas: PCK e latência ──────────────────────────────────────────────────
def _calc_pck(results, threshold: float = 0.5) -> float | None:
    if not results or results[0].keypoints is None:
        return None
    kps = results[0].keypoints.data
    if kps.numel() == 0:
        return None
    return round(float((kps[:, :, 2] > threshold).float().mean()), 4)


def _send_metrics(
    lat_total_ms: float,
    lat_epi_ms: float,
    lat_pose_ms: float,
    pck_pose: float | None,
    conf_media_epi: float | None,
):
    if not _ws._loop or not _ws.CONNECTED_CLIENTS:
        return
    msg = json.dumps({
        "type":               "metrics",
        "latencia_total_ms":  round(lat_total_ms, 1),
        "latencia_epi_ms":    round(lat_epi_ms, 1),
        "latencia_pose_ms":   round(lat_pose_ms, 1),
        "pck_pose":           pck_pose,
        "conf_media_epi":     conf_media_epi,
    })
    async def _broadcast():
        for client in list(_ws.CONNECTED_CLIENTS):
            try:
                await client.send(msg)
            except Exception:
                _ws.CONNECTED_CLIENTS.discard(client)
    asyncio.run_coroutine_threadsafe(_broadcast(), _ws._loop)


# ── Beep cross-platform (corrige Bug #2) ───────────────────────────────────────
def _beep():
    try:
        import winsound
        winsound.Beep(1000, 300)
    except ImportError:
        print("\a", end="", flush=True)


# ── Worker de POST HTTP — fila única (corrige Bug #3) ─────────────────────────
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


# ── Carregamento da zona de risco no startup ───────────────────────────────────
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


def _load_zona(zone_checker, camera_id: str) -> bool:
    config = _fetch_zona_from_backend(camera_id)

    if config is None:
        config = config_server.load_config()
        if config:
            print(f"[ZONA] Carregada do arquivo local: '{config.get('nome')}'")

    if config is None:
        print("[ZONA] Nenhuma zona configurada — verificação de zona desativada.")
        print(f"[ZONA] Configure via POST http://localhost:{CONFIG_SERVER_PORT}/zona/configurar")
        return False

    try:
        zone_checker.configure(
            config.get("camera_id", camera_id),
            config["nome"],
            config["pontos"],
            epis_obrigatorios=config.get("epis_obrigatorios", []),
            epis_certo_labels=config.get("epis_certo_labels", []),
        )
        return True
    except Exception as e:
        print(f"[ZONA] Erro ao aplicar config: {e}")
        return False


# ── Thread de captura separada (corrige Bug #4) ────────────────────────────────
def _capture_loop(camera: Camera, frame_q: queue.Queue, max_width: int | None = None):
    while camera.is_opened():
        ret, frame = camera.read()
        if not ret:
            break
        # Downscale logo na captura — reduz custo de pose/encode/websocket rio abaixo.
        # Importante sobretudo pro stream de rede (celular), que costuma vir em alta resolução.
        if max_width and frame.shape[1] > max_width:
            scale = max_width / frame.shape[1]
            frame = cv2.resize(frame, (max_width, int(frame.shape[0] * scale)))
        if frame_q.full():
            try:
                frame_q.get_nowait()
            except queue.Empty:
                pass
        frame_q.put(frame)


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    global CAMERA_SOURCE, CAMERA_SOURCE_LATERAL, CAMERA_ID
    CAMERA_SOURCE, CAMERA_SOURCE_LATERAL, CAMERA_ID = _resolve_camera_sources()

    model_epi  = os.path.join(ROOT, "ml_service", "vision", "models", "best.pt")
    model_pose = os.path.join(ROOT, "yolov8n-pose.pt")

    dual_camera = bool(CAMERA_SOURCE_LATERAL)

    print("[INIT] Carregando modelos...")
    try:
        camera        = Camera(source=CAMERA_SOURCE)
        camera_lateral = Camera(source=CAMERA_SOURCE_LATERAL) if dual_camera else None
        epi_detector  = EPIDetector(model_path=model_epi, imgsz=MODEL_IMGSZ)
        pose_model    = load_yolo_with_engine_fallback(model_pose, imgsz=MODEL_IMGSZ)
        pose_analyzer = PoseAnalyzer(model_path=None)
        zone_checker  = ZoneChecker(model_path=None)
    except Exception as e:
        print(f"[ERRO] Falha na inicialização: {e}")
        return

    camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if camera_lateral is not None:
        # BUFFERSIZE=1: sem isso, um stream de rede (celular) acumula frames num buffer
        # interno do OpenCV mais rápido do que conseguimos consumir — o atraso cresce
        # sem parar em vez de estabilizar. Também tentamos setar resolução (funciona só
        # em câmeras locais; streams MJPEG ignoram e continuam na resolução do app).
        camera_lateral.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        camera_lateral.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera_lateral.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    _load_zona(zone_checker, CAMERA_ID)
    config_server.start(zone_checker, CAMERA_ID, CONFIG_SERVER_PORT)

    epi_debouncer  = IncidentDebouncer(required_frames=FRAMES_EPI,  cooldown_frames=COOLDOWN_EPI)
    ergo_debouncer = SimpleDebouncer(required_frames=FRAMES_ERGO, cooldown_frames=COOLDOWN_ERGO)
    zona_debouncer = SimpleDebouncer(required_frames=FRAMES_ZONA, cooldown_frames=COOLDOWN_ZONA)

    _epi_state = {"counter": 0, "cache": [], "running": False}  # estado persistente entre frames
    _pose_state = {
        "counter": 0, "raw": None, "lat_ms": 0.0, "pck": None,
        "pessoas": [], "pessoas_frontal": [], "pessoas_lateral": [],
    }
    queda_debouncer = SimpleDebouncer(required_frames=6, cooldown_frames=120)  # 6 frames = ~0.2s
    threading.Thread(target=_post_worker, daemon=True).start()
    start_server_in_thread()

    frame_queue = queue.Queue(maxsize=2)
    threading.Thread(target=_capture_loop, args=(camera, frame_queue, 640), daemon=True).start()

    frame_queue_lateral = None
    _last_lateral_frame = {"frame": None}
    if camera_lateral is not None:
        frame_queue_lateral = queue.Queue(maxsize=2)
        threading.Thread(target=_capture_loop, args=(camera_lateral, frame_queue_lateral, 480), daemon=True).start()

    zona_info = zone_checker.get(CAMERA_ID)
    _verdict_cooldown = 0   # frames restantes antes de voltar para MONITORANDO
    print("[OK] Orquestrador ativo — ESC para sair")
    print(f"     Unidade:   {CAMERA_ID}")
    print(f"     EPI:       {model_epi}  (câmera frontal: {CAMERA_SOURCE})")
    if dual_camera:
        print(f"     Pose:      yolov8n-pose.pt  (câmera lateral: {CAMERA_SOURCE_LATERAL})")
    else:
        print(f"     Pose:      yolov8n-pose.pt (compartilhado entre ergonomia e zona, câmera única)")
    print(f"     Ergonomia: REBA ≥ {REBA_RISCO_MINIMO} dispara risco  ({FRAMES_ERGO} frames p/ confirmar)")
    print(f"     Zona:      {zona_info['nome'] if zona_info else '(não configurada)'}  ({FRAMES_ZONA} frames p/ confirmar)")

    try:
        while True:
            frame  = frame_queue.get()
            t_start = time.perf_counter()

            # Frame usado para pose (ergonomia + zona): vem da câmera lateral quando
            # configurada (2ª câmera da mesma unidade); senão cai no frame frontal.
            frame_pose = frame
            if frame_queue_lateral is not None:
                try:
                    _last_lateral_frame["frame"] = frame_queue_lateral.get_nowait()
                except queue.Empty:
                    pass
                if _last_lateral_frame["frame"] is not None:
                    frame_pose = _last_lateral_frame["frame"]
                    send_frame_lateral(frame_pose)

            # 1. EPI — Roboflow roda em background a cada 5 frames sem bloquear o loop
            _epi_state["counter"] += 1
            if _epi_state["counter"] >= 5 and not _epi_state["running"]:
                _epi_state["counter"] = 0
                _epi_state["running"] = True
                _frame_snap = frame.copy()
                def _epi_bg():
                    result = epi_detector.run(_frame_snap)
                    _epi_state["cache"]   = result
                    _epi_state["running"] = False
                threading.Thread(target=_epi_bg, daemon=True).start()

            lat_epi_ms = 0.0
            epi_dets   = _epi_state["cache"]
            epi_incidents  = epi_detector.incidents(epi_dets)
            epi_confirmed  = epi_debouncer.update(epi_incidents)
            conf_media_epi = (
                round(sum(d.confidence for d in epi_dets) / len(epi_dets), 4)
                if epi_dets else None
            )

            # 2 + 3. Pose — roda nas DUAS câmeras da unidade quando há lateral configurada.
            # A pessoa vira naturalmente; a câmera que estiver vendo de perfil no momento
            # é que dá leitura confiável de ergonomia, então usamos a melhor das duas em
            # vez de fixar só na lateral (a cada 2 frames, pra não saturar a GPU/CPU).
            _pose_state["counter"] += 1
            if _pose_state["counter"] >= 2 or _pose_state["raw"] is None:
                _pose_state["counter"] = 0
                raw_lateral = pose_model(frame_pose, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
                _pose_state["raw"]    = raw_lateral   # usado pelo zone_checker (câmera lateral)
                _pose_state["lat_ms"] = raw_lateral[0].speed.get("inference", 0.0)
                _pose_state["pck"]    = _calc_pck(raw_lateral)
                pessoas_lateral       = pose_analyzer.analyze_from_results(raw_lateral)

                if dual_camera:
                    raw_frontal     = pose_model(frame, verbose=False, imgsz=MODEL_IMGSZ, conf=POSE_CONF_MINIMO)
                    pessoas_frontal = pose_analyzer.analyze_from_results(raw_frontal)
                    _pose_state["pessoas_frontal"] = pessoas_frontal
                    _pose_state["pessoas_lateral"] = pessoas_lateral
                    # Pra decidir ALERTA: "mesma_pessoa" funde por índice (mesmo posto,
                    # ângulos complementares); "independente" só junta as duas listas —
                    # cada pessoa detectada conta uma vez, sem virar a mesma nas duas câmeras.
                    if CAMERA_DUAL_MODE == "mesma_pessoa":
                        _pose_state["pessoas"] = _merge_pose_readings(pessoas_frontal, pessoas_lateral)
                    else:
                        _pose_state["pessoas"] = pessoas_frontal + pessoas_lateral
                else:
                    # Câmera única: frame_pose é a própria frontal, não uma lateral de verdade.
                    _pose_state["pessoas_frontal"] = pessoas_lateral
                    _pose_state["pessoas_lateral"] = []
                    _pose_state["pessoas"] = pessoas_lateral

            raw_pose      = _pose_state["raw"]
            lat_pose_ms   = _pose_state["lat_ms"]
            pck_pose      = _pose_state["pck"]
            ergo_pessoas  = _pose_state["pessoas"]

            # ── REBA: filtra pessoas em risco (score >= REBA_RISCO_MINIMO) ──
            ergo_em_risco  = [p for p in ergo_pessoas if _pessoa_em_risco_ergo(p)]
            ergo_confirmed = ergo_debouncer.update(len(ergo_em_risco) > 0)

            # ── Queda: detecta e confirma após 3 frames consecutivos ──────
            queda_detectada   = any(p.get("queda", False) for p in ergo_pessoas)
            queda_confirmed   = queda_debouncer.update(queda_detectada)

            if zone_checker.get(CAMERA_ID) is not None:
                _, zona_pessoas = zone_checker.check_from_results(CAMERA_ID, raw_pose)
                zona_confirmed  = zona_debouncer.update(any(p["invadiu"] for p in zona_pessoas))
            else:
                zona_pessoas   = []
                zona_confirmed = False

            # 4. Veredicto em tempo real (sem debounce — para o frontend)
            zona_em_risco = [p for p in zona_pessoas if p["invadiu"]]
            live_verdict  = _aggregate(
                epi_incidents,
                ergo_em_risco,
                zona_em_risco,
                epi_dets=epi_dets,
            )

            # Estabiliza o verdict — só volta para MONITORANDO após 20 frames sem risco
            if live_verdict.status != "MONITORANDO":
                _verdict_cooldown = 20
                _send_verdict(live_verdict)
            elif _verdict_cooldown > 0:
                _verdict_cooldown -= 1
                # mantém o último verdict de risco durante o cooldown
            else:
                _send_verdict(live_verdict)

            # 4.5 Alerta de queda — envia mensagem especial ao frontend
            if queda_confirmed:
                if _ws._loop and _ws.CONNECTED_CLIENTS:
                    import json as _json
                    _msg = _json.dumps({
                        "type":      "queda",
                        "timestamp": datetime.now().isoformat(),
                        "pessoas":   [p["pessoa_id"] for p in ergo_pessoas if p.get("queda")],
                    })
                    async def _send_queda():
                        for client in list(_ws.CONNECTED_CLIENTS):
                            try:
                                await client.send(_msg)
                            except Exception:
                                _ws.CONNECTED_CLIENTS.discard(client)
                    asyncio.run_coroutine_threadsafe(_send_queda(), _ws._loop)

            # 5. WebSocket → frontend
            send_frame(frame)

            send_detections([
                {
                    "label":      d.label,
                    "confidence": round(float(d.confidence), 4),
                    "x1": int(d.x1), "y1": int(d.y1),
                    "x2": int(d.x2), "y2": int(d.y2),
                }
                for d in epi_dets
            ])

            # keypoints + reba_score + reba_level para o frontend — sempre a detecção
            # REAL de cada câmera (nunca a lista fundida), pra cada canvas só desenhar
            # gente que essa câmera especificamente viu.
            send_pose(_pose_state["pessoas_frontal"], source="frontal")
            if dual_camera:
                send_pose(_pose_state["pessoas_lateral"], source="lateral")

            # 6. Veredicto confirmado (debounced) → beep + banco
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
                    )

                threading.Thread(target=_beep, daemon=True).start()

                _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                img_b64   = base64.b64encode(buffer).decode("utf-8")

                payload = {
                    "timestamp":  timestamp.isoformat(),
                    "label":      ", ".join(confirmed_verdict.reasons),
                    "confidence": confirmed_verdict.confidence,
                    "img_Frame":  img_b64,
                    "source":     ", ".join(confirmed_verdict.sources),
                    "camera_id":  CAMERA_ID,   # identifica a UNIDADE (par frontal+lateral), não uma câmera isolada
                }

                # Só existe frame lateral de verdade quando a 2ª câmera está configurada
                # (senão frame_pose é só um alias do frame frontal, redundante)
                if dual_camera and _last_lateral_frame["frame"] is not None:
                    _, buffer_lateral = cv2.imencode(".jpg", frame_pose, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    payload["img_Frame_lateral"] = base64.b64encode(buffer_lateral).decode("utf-8")

                _post_queue.put(payload)

            # 7. Métricas de latência/qualidade — a cada frame
            lat_total_ms = (time.perf_counter() - t_start) * 1000
            _send_metrics(lat_total_ms, lat_epi_ms, lat_pose_ms, pck_pose, conf_media_epi)

            if cv2.waitKey(1) & 0xFF == 27:
                break

    finally:
        camera.release()
        if camera_lateral is not None:
            camera_lateral.release()
        cv2.destroyAllWindows()
        print("[OK] Recursos liberados.")


if __name__ == "__main__":
    main()