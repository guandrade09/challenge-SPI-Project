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

from ultralytics import YOLO
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from ml_service.streaming.websocket_server import (
    send_frame, send_alert, send_detections, send_pose, start_server_in_thread,
)
import ml_service.streaming.websocket_server as _ws
from core.entities import Detection
from pose_analyzer import PoseAnalyzer
from zone_checker import ZoneChecker
import config_server

# ── Configuração ───────────────────────────────────────────────────────────────
BACKEND_URL        = "http://localhost:3000/api/detections"
BACKEND_ZONAS_URL  = "http://localhost:3000/api/zonas"
CONFIG_SERVER_PORT = 5050
CAMERA_SOURCE      = 0
CAMERA_ID          = "cam_01"

# Frames consecutivos necessários para confirmar cada tipo de risco
FRAMES_EPI   = 10
FRAMES_ERGO  = 8
FRAMES_ZONA  = 3
COOLDOWN_EPI  = 60
COOLDOWN_ERGO = 60
COOLDOWN_ZONA = 30

# Limiar REBA para considerar risco ergonômico (inclusive)
REBA_RISCO_MINIMO = 4   # MÉDIO = 4–7, ALTO = 8–15


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
def _capture_loop(camera: Camera, frame_q: queue.Queue):
    while camera.is_opened():
        ret, frame = camera.read()
        if not ret:
            break
        if frame_q.full():
            try:
                frame_q.get_nowait()
            except queue.Empty:
                pass
        frame_q.put(frame)


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    model_epi = os.path.join(ROOT, "ml_service", "vision", "models", "best.pt")

    print("[INIT] Carregando modelos...")
    try:
        camera        = Camera(source=CAMERA_SOURCE)
        epi_detector  = EPIDetector(model_path=model_epi)
        pose_model    = YOLO("yolov8n-pose.pt")
        pose_analyzer = PoseAnalyzer(model_path=None)
        zone_checker  = ZoneChecker(model_path=None)
    except Exception as e:
        print(f"[ERRO] Falha na inicialização: {e}")
        return

    camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    _load_zona(zone_checker, CAMERA_ID)
    config_server.start(zone_checker, CAMERA_ID, CONFIG_SERVER_PORT)

    epi_debouncer  = IncidentDebouncer(required_frames=FRAMES_EPI,  cooldown_frames=COOLDOWN_EPI)
    ergo_debouncer = SimpleDebouncer(required_frames=FRAMES_ERGO, cooldown_frames=COOLDOWN_ERGO)
    zona_debouncer = SimpleDebouncer(required_frames=FRAMES_ZONA, cooldown_frames=COOLDOWN_ZONA)

    _epi_state = {"counter": 0, "cache": [], "running": False}  # estado persistente entre frames
    queda_debouncer = SimpleDebouncer(required_frames=6, cooldown_frames=120)  # 6 frames = ~0.2s
    threading.Thread(target=_post_worker, daemon=True).start()
    start_server_in_thread()

    frame_queue = queue.Queue(maxsize=2)
    threading.Thread(target=_capture_loop, args=(camera, frame_queue), daemon=True).start()

    zona_info = zone_checker.get(CAMERA_ID)
    _verdict_cooldown = 0   # frames restantes antes de voltar para MONITORANDO
    print("[OK] Orquestrador ativo — ESC para sair")
    print(f"     EPI:       {model_epi}")
    print(f"     Pose:      yolov8n-pose.pt (compartilhado entre ergonomia e zona)")
    print(f"     Ergonomia: REBA ≥ {REBA_RISCO_MINIMO} dispara risco  ({FRAMES_ERGO} frames p/ confirmar)")
    print(f"     Zona:      {zona_info['nome'] if zona_info else '(não configurada)'}  ({FRAMES_ZONA} frames p/ confirmar)")

    try:
        while True:
            frame  = frame_queue.get()
            t_start = time.perf_counter()

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

            # 2 + 3. Pose (modelo compartilhado — roda UMA vez)
            raw_pose    = pose_model(frame, verbose=False, imgsz=320)
            lat_pose_ms = raw_pose[0].speed.get("inference", 0.0)
            pck_pose    = _calc_pck(raw_pose)

            ergo_pessoas  = pose_analyzer.analyze_from_results(raw_pose)

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

            send_pose(ergo_pessoas)   # keypoints + reba_score + reba_level para o frontend

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

                _post_queue.put({
                    "timestamp":  timestamp.isoformat(),
                    "label":      ", ".join(confirmed_verdict.reasons),
                    "confidence": confirmed_verdict.confidence,
                    "img_Frame":  img_b64,
                    "source":     ", ".join(confirmed_verdict.sources),
                })

            # 7. Métricas de latência/qualidade — a cada frame
            lat_total_ms = (time.perf_counter() - t_start) * 1000
            _send_metrics(lat_total_ms, lat_epi_ms, lat_pose_ms, pck_pose, conf_media_epi)

            if cv2.waitKey(1) & 0xFF == 27:
                break

    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("[OK] Recursos liberados.")


if __name__ == "__main__":
    main()