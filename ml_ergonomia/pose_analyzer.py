import base64
import numpy as np
import cv2
from ultralytics import YOLO

# COCO keypoint indices
NOSE = 0
LEFT_SHOULDER = 5
RIGHT_SHOULDER = 6
LEFT_HIP = 11
RIGHT_HIP = 12
LEFT_KNEE = 13
RIGHT_KNEE = 14

KP_CONF_THRESHOLD = 0.3

COLUNA_RISCO_IMEDIATO = 120.0
COLUNA_INADEQUADA_MAX = 160.0
PESCOCO_INADEQUADO = 145.0
ASSIMETRIA_OMBROS_PX = 20.0


def decode_frame(frame_b64: str) -> np.ndarray:
    try:
        img_bytes = base64.b64decode(frame_b64)
    except Exception:
        raise ValueError("base64 inválido")
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("não foi possível decodificar a imagem")
    return frame


def _angle(a, b, c) -> float | None:
    """Ângulo em graus no ponto b formado por a-b-c."""
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    c = np.array(c, dtype=float)
    ba = a - b
    bc = c - b
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)
    if norm_ba < 1e-6 or norm_bc < 1e-6:
        return None
    cosine = np.clip(np.dot(ba, bc) / (norm_ba * norm_bc), -1.0, 1.0)
    return float(np.degrees(np.arccos(cosine)))


def _kp_visible(kp) -> bool:
    return float(kp[2]) >= KP_CONF_THRESHOLD


def _classify(coluna: float | None, pescoco: float | None, kps: np.ndarray) -> str:
    if coluna is not None and coluna < COLUNA_RISCO_IMEDIATO:
        return "risco_imediato"

    inadequate = False

    if coluna is not None and coluna < COLUNA_INADEQUADA_MAX:
        inadequate = True

    if pescoco is not None and pescoco < PESCOCO_INADEQUADO:
        inadequate = True

    kp_ls = kps[LEFT_SHOULDER]
    kp_rs = kps[RIGHT_SHOULDER]
    if _kp_visible(kp_ls) and _kp_visible(kp_rs):
        if abs(float(kp_ls[1]) - float(kp_rs[1])) > ASSIMETRIA_OMBROS_PX:
            inadequate = True

    return "ergonomicamente_inadequada" if inadequate else "adequada"


class PoseAnalyzer:
    def __init__(self, model_path: str | None = "yolov8n-pose.pt"):
        self.model_name = model_path or "yolov8n-pose.pt"
        self.model = YOLO(model_path) if model_path else None

    def analyze_from_results(self, results) -> list[dict]:
        """Processa resultados já computados do YOLO — não chama o modelo."""
        if not results or results[0].keypoints is None:
            return []

        result = results[0]
        kps_all = result.keypoints.data
        boxes   = result.boxes
        pessoas = []

        for i, kps in enumerate(kps_all.cpu().numpy()):
            if boxes is not None and i < len(boxes):
                bbox     = list(map(int, boxes[i].xyxy[0].tolist()))
                conf_det = round(float(boxes[i].conf[0]), 4)
            else:
                bbox     = []
                conf_det = 0.0

            # Usa o lado com melhor visibilidade (evita oclusão)
            kp_sr, kp_hr, kp_kr = kps[RIGHT_SHOULDER], kps[RIGHT_HIP], kps[RIGHT_KNEE]
            kp_sl, kp_hl, kp_kl = kps[LEFT_SHOULDER],  kps[LEFT_HIP],  kps[LEFT_KNEE]

            right_ok = _kp_visible(kp_sr) and _kp_visible(kp_hr) and _kp_visible(kp_kr)
            left_ok  = _kp_visible(kp_sl) and _kp_visible(kp_hl) and _kp_visible(kp_kl)

            coluna = None
            if right_ok and left_ok:
                # usa o lado com maior confiança média
                conf_r = (float(kp_sr[2]) + float(kp_hr[2]) + float(kp_kr[2])) / 3
                conf_l = (float(kp_sl[2]) + float(kp_hl[2]) + float(kp_kl[2])) / 3
                if conf_r >= conf_l:
                    coluna = _angle(kp_sr[:2], kp_hr[:2], kp_kr[:2])
                else:
                    coluna = _angle(kp_sl[:2], kp_hl[:2], kp_kl[:2])
            elif right_ok:
                coluna = _angle(kp_sr[:2], kp_hr[:2], kp_kr[:2])
            elif left_ok:
                coluna = _angle(kp_sl[:2], kp_hl[:2], kp_kl[:2])

            # Pescoço: usa o ombro mais visível
            kp_n = kps[NOSE]
            kp_s = kp_sr if float(kp_sr[2]) >= float(kp_sl[2]) else kp_sl
            kp_h = kp_hr if float(kp_hr[2]) >= float(kp_hl[2]) else kp_hl
            pescoco = None
            if _kp_visible(kp_n) and _kp_visible(kp_s) and _kp_visible(kp_h):
                pescoco = _angle(kp_n[:2], kp_s[:2], kp_h[:2])

            angulos = {}
            if coluna  is not None:
                angulos["coluna"]  = round(coluna, 1)
            if pescoco is not None:
                angulos["pescoco"] = round(pescoco, 1)

            pessoas.append({
                "pessoa_id":          i,
                "bbox":               bbox,
                "classe":             _classify(coluna, pescoco, kps),
                "angulos":            angulos,
                "confianca_deteccao": conf_det,
                "keypoints":          kps.tolist(),   # [[x, y, conf] × 17] para desenho no frontend
            })

        return pessoas

    def analyze(self, frame: np.ndarray) -> list[dict]:
        """Roda o modelo internamente — uso no Flask standalone."""
        if self.model is None:
            raise RuntimeError("modelo não carregado — use analyze_from_results()")
        results = self.model(frame, verbose=False)
        return self.analyze_from_results(results)
