from __future__ import annotations

import base64
import math
from dataclasses import dataclass, asdict
from typing import Optional

import cv2
import numpy as np
from ultralytics import YOLO


NOSE           = 0
LEFT_SHOULDER  = 5
RIGHT_SHOULDER = 6
LEFT_HIP       = 11
RIGHT_HIP      = 12
LEFT_KNEE      = 13
RIGHT_KNEE     = 14
LEFT_ANKLE     = 15
RIGHT_ANKLE    = 16

KP_CONF_THRESHOLD  = 0.2   
KP_MINIMO_VISIVEL  = 3     

@dataclass
class RebaResult:
    score: int            
    level: str            
    subscores: dict        
    angles: dict          



def _angle(a, b, c) -> Optional[float]:
    """Ângulo em graus no ponto b, formado pelo segmento a-b-c."""
    a, b, c = np.array(a, float), np.array(b, float), np.array(c, float)
    ba, bc = a - b, c - b
    n_ba, n_bc = np.linalg.norm(ba), np.linalg.norm(bc)
    if n_ba < 1e-6 or n_bc < 1e-6:
        return None
    cos = np.clip(np.dot(ba, bc) / (n_ba * n_bc), -1.0, 1.0)
    return float(np.degrees(np.arccos(cos)))


def _visible(kp) -> bool:
    return float(kp[2]) >= KP_CONF_THRESHOLD


def _best(kp_left, kp_right):
    """Retorna o keypoint com maior confiança entre esquerdo e direito."""
    return kp_left if float(kp_left[2]) >= float(kp_right[2]) else kp_right


def _midpoint(kp_a, kp_b):
    """Ponto médio entre dois keypoints (ignora confiança)."""
    return ((float(kp_a[0]) + float(kp_b[0])) / 2,
            (float(kp_a[1]) + float(kp_b[1])) / 2)




def _trunk_score(angle_deg: Optional[float]) -> tuple[int, str]:
    """
    Tronco: ângulo ombro-quadril-joelho (extensão da coluna em relação à perna).

    Ângulo próximo de 180° = postura ereta. Quanto menor, maior a flexão.
    Escala REBA (tronco):
      > 170°  → 1  (neutro)
      150–170 → 2  (leve flexão/extensão)
      120–149 → 3  (flexão moderada)
      90–119  → 4  (flexão acentuada)
      < 90°   → 5  (flexão severa — risco imediato)
    """
    if angle_deg is None:
        return 3, "indisponível"   
    if angle_deg > 170:
        return 1, "neutro"
    if angle_deg > 150:
        return 2, "leve"
    if angle_deg > 120:
        return 3, "moderado"
    if angle_deg > 90:
        return 4, "acentuado"
    return 5, "severo"


def _neck_score(angle_deg: Optional[float], bust_only: bool = False) -> tuple[int, str]:
    """
    Pescoço: ângulo nariz-ombro-quadril (ou fallback bust-only).

    Bust-only usa thresholds mais permissivos porque o ponto virtual
    comprime o ângulo geometricamente, gerando valores menores que o real.
      Normal:    > 160° → 1,  140–160 → 2,  < 140° → 3
      Bust-only: > 140° → 1,  110–140 → 2,  < 110° → 3
    """
    if angle_deg is None:
        return 2, "indisponível"
    if bust_only:
        if angle_deg > 140:
            return 1, "neutro"
        if angle_deg > 110:
            return 2, "leve"
        return 3, "excessivo"
    if angle_deg > 160:
        return 1, "neutro"
    if angle_deg > 140:
        return 2, "leve"
    return 3, "excessivo"


def _legs_score(angle_deg: Optional[float]) -> tuple[int, str]:
    """
    Pernas: ângulo quadril-joelho-tornozelo (flexão do joelho).

    ~180° = perna estendida (sentado/em pé neutro).
    Joelho muito flexionado indica agachamento ou postura de esforço.
    Escala REBA (pernas):
      > 160°  → 1  (estendido / sentado neutro)
      120–160 → 2  (leve flexão)
      90–119  → 3  (flexão moderada — agachamento parcial)
      < 90°   → 4  (agachamento acentuado)
    """
    if angle_deg is None:
        return 1, "indisponível"   
    if angle_deg > 160:
        return 1, "estendido"
    if angle_deg > 120:
        return 2, "leve"
    if angle_deg > 90:
        return 3, "moderado"
    return 4, "acentuado"


def _shoulder_asymmetry_score(kp_ls, kp_rs) -> tuple[int, str]:
    """
    Assimetria de ombros (grupo B — carga lateral / torção).

    Diferença de altura (eixo Y em pixels) entre ombro esquerdo e direito.
    Escala:
      < 20 px  → 1  (simétrico)
      20–50 px → 2  (assimetria leve)
      50–90 px → 3  (assimetria moderada)
      > 90 px  → 4  (assimetria severa — possível torção de tronco)
    """
    if not (_visible(kp_ls) and _visible(kp_rs)):
        return 1, "indisponível"
    diff = abs(float(kp_ls[1]) - float(kp_rs[1]))
    if diff < 20:
        return 1, "simétrico"
    if diff < 50:
        return 2, "leve"
    if diff < 90:
        return 3, "moderado"
    return 4, "severo"



_TABLE_A: dict[tuple[int, int, int], int] = {
    # trunk=1
    (1, 1, 1): 1,  (1, 1, 2): 2,  (1, 1, 3): 3,  (1, 1, 4): 4,
    (1, 2, 1): 2,  (1, 2, 2): 3,  (1, 2, 3): 4,  (1, 2, 4): 5,
    (1, 3, 1): 3,  (1, 3, 2): 4,  (1, 3, 3): 5,  (1, 3, 4): 6,
    # trunk=2
    (2, 1, 1): 2,  (2, 1, 2): 3,  (2, 1, 3): 4,  (2, 1, 4): 5,
    (2, 2, 1): 3,  (2, 2, 2): 4,  (2, 2, 3): 5,  (2, 2, 4): 6,
    (2, 3, 1): 4,  (2, 3, 2): 5,  (2, 3, 3): 6,  (2, 3, 4): 7,
    # trunk=3
    (3, 1, 1): 3,  (3, 1, 2): 4,  (3, 1, 3): 5,  (3, 1, 4): 6,
    (3, 2, 1): 4,  (3, 2, 2): 5,  (3, 2, 3): 6,  (3, 2, 4): 7,
    (3, 3, 1): 5,  (3, 3, 2): 6,  (3, 3, 3): 7,  (3, 3, 4): 8,
    # trunk=4
    (4, 1, 1): 5,  (4, 1, 2): 6,  (4, 1, 3): 7,  (4, 1, 4): 8,
    (4, 2, 1): 6,  (4, 2, 2): 7,  (4, 2, 3): 8,  (4, 2, 4): 9,
    (4, 3, 1): 7,  (4, 3, 2): 8,  (4, 3, 3): 9,  (4, 3, 4): 9,
    # trunk=5
    (5, 1, 1): 7,  (5, 1, 2): 8,  (5, 1, 3): 9,  (5, 1, 4): 9,
    (5, 2, 1): 8,  (5, 2, 2): 9,  (5, 2, 3): 9,  (5, 2, 4): 9,
    (5, 3, 1): 9,  (5, 3, 2): 9,  (5, 3, 3): 9,  (5, 3, 4): 9,
}


_TABLE_C: dict[tuple[int, int], int] = {
    (1, 1): 1,  (1, 2): 2,  (1, 3): 3,  (1, 4): 4,
    (2, 1): 2,  (2, 2): 3,  (2, 3): 4,  (2, 4): 5,
    (3, 1): 3,  (3, 2): 4,  (3, 3): 5,  (3, 4): 6,
    (4, 1): 4,  (4, 2): 5,  (4, 3): 6,  (4, 4): 7,
    (5, 1): 5,  (5, 2): 6,  (5, 3): 7,  (5, 4): 8,
    (6, 1): 6,  (6, 2): 7,  (6, 3): 8,  (6, 4): 9,
    (7, 1): 7,  (7, 2): 8,  (7, 3): 9,  (7, 4): 10,
    (8, 1): 8,  (8, 2): 9,  (8, 3): 10, (8, 4): 11,
    (9, 1): 9,  (9, 2): 10, (9, 3): 11, (9, 4): 12,
}


def _reba_level(score: int) -> str:
    if score <= 3:
        return "BAIXO"
    if score <= 7:
        return "MÉDIO"
    return "ALTO"


# Detecção de queda


FALL_KP_CONF_THRESHOLD = 0.5  # mais rígido que KP_CONF_THRESHOLD: queda é um alerta crítico,
                                # e keypoints do tronco inferior com confiança só acima do
                                # threshold frouxo geral costumam ser chute do modelo (corpo
                                # cortado no enquadramento da câmera), não detecção real.


def detect_fall(kps: np.ndarray, bbox: list) -> bool:

    kp_n  = kps[NOSE]
    kp_ls = kps[LEFT_SHOULDER]
    kp_rs = kps[RIGHT_SHOULDER]

    # Critério 1: nariz abaixo dos ombros
    if _visible(kp_n) and (_visible(kp_ls) or _visible(kp_rs)):
        kp_s = _best(kp_ls, kp_rs)
        if _visible(kp_s):
            nose_y    = float(kp_n[1])
            shoulder_y = float(kp_s[1])
            # Em coordenadas de imagem, Y cresce para baixo
            # Nariz acima do ombro = nose_y < shoulder_y (normal)
            # Nariz abaixo ou no nível do ombro = queda
            if nose_y >= shoulder_y * 0.95:
                return True

    # Critério 2: corpo na horizontal — só confiável se ombro, quadril E
    # perna (joelho/tornozelo) estão REALMENTE visíveis com confiança alta.
    # Um enquadramento cortado na cintura (comum em webcam de notebook, ou
    # braço esticado pra frente) já produz um bbox mais largo que alto sem
    # ninguém ter caído — sem ver o quadril/perna de verdade não dá pra
    # distinguir "câmera cortou o corpo" de "pessoa caiu no chão".
    kp_lh, kp_rh = kps[LEFT_HIP],  kps[RIGHT_HIP]
    kp_lk, kp_rk = kps[LEFT_KNEE], kps[RIGHT_KNEE]
    kp_la, kp_ra = kps[LEFT_ANKLE], kps[RIGHT_ANKLE]

    shoulder_ok = float(kp_ls[2]) >= FALL_KP_CONF_THRESHOLD or float(kp_rs[2]) >= FALL_KP_CONF_THRESHOLD
    hip_ok      = float(kp_lh[2]) >= FALL_KP_CONF_THRESHOLD or float(kp_rh[2]) >= FALL_KP_CONF_THRESHOLD
    leg_ok      = (
        float(kp_lk[2]) >= FALL_KP_CONF_THRESHOLD or float(kp_rk[2]) >= FALL_KP_CONF_THRESHOLD or
        float(kp_la[2]) >= FALL_KP_CONF_THRESHOLD or float(kp_ra[2]) >= FALL_KP_CONF_THRESHOLD
    )

    if shoulder_ok and hip_ok and leg_ok and len(bbox) == 4:
        x1, y1, x2, y2 = bbox
        w = x2 - x1
        h = y2 - y1
        if h > 0 and w / h > 1.5:
            return True

    return False


# ---------------------------------------------------------------------------
# Função principal de cálculo REBA
# ---------------------------------------------------------------------------
def calculate_reba(kps: np.ndarray) -> RebaResult:
    
    n_visiveis = int(np.sum(kps[:, 2] >= KP_CONF_THRESHOLD))
    if n_visiveis < KP_MINIMO_VISIVEL:
        return RebaResult(
            score=1,
            level="BAIXO",
            subscores={"motivo": "keypoints_insuficientes", "visiveis": n_visiveis},
            angles={},
        )
    kp_ls = kps[LEFT_SHOULDER]
    kp_rs = kps[RIGHT_SHOULDER]
    kp_lh = kps[LEFT_HIP]
    kp_rh = kps[RIGHT_HIP]
    kp_lk = kps[LEFT_KNEE]
    kp_rk = kps[RIGHT_KNEE]
    kp_la = kps[LEFT_ANKLE]
    kp_ra = kps[RIGHT_ANKLE]
    kp_n  = kps[NOSE]


    right_spine = _visible(kp_rs) and _visible(kp_rh) and _visible(kp_rk)
    left_spine  = _visible(kp_ls) and _visible(kp_lh) and _visible(kp_lk)

    angle_trunk: Optional[float] = None
    if right_spine and left_spine:
        cr = (float(kp_rs[2]) + float(kp_rh[2]) + float(kp_rk[2])) / 3
        cl = (float(kp_ls[2]) + float(kp_lh[2]) + float(kp_lk[2])) / 3
        if cr >= cl:
            angle_trunk = _angle(kp_rs[:2], kp_rh[:2], kp_rk[:2])
        else:
            angle_trunk = _angle(kp_ls[:2], kp_lh[:2], kp_lk[:2])
    elif right_spine:
        angle_trunk = _angle(kp_rs[:2], kp_rh[:2], kp_rk[:2])
    elif left_spine:
        angle_trunk = _angle(kp_ls[:2], kp_lh[:2], kp_lk[:2])

    elif _visible(kp_ls) and _visible(kp_rs) and _visible(kp_n):
        import math as _math
        mid_s  = _midpoint(kp_ls, kp_rs)
        nose_x, nose_y = float(kp_n[0]), float(kp_n[1])
        mid_x,  mid_y  = mid_s[0], mid_s[1]


        dist_y = mid_y - nose_y
        dist_x = abs(nose_x - mid_x)

        if dist_y > 1e-3:
            raw = _math.degrees(_math.atan2(dist_y, dist_x + 1e-6))
            angle_trunk = 90.0 + raw
        else:
            
            angle_trunk = 85.0

    
    kp_s_best = _best(kp_ls, kp_rs)
    kp_h_best = _best(kp_lh, kp_rh)

    angle_neck: Optional[float] = None
    neck_bust_only = False
    if _visible(kp_n) and _visible(kp_s_best) and _visible(kp_h_best):
        angle_neck = _angle(kp_n[:2], kp_s_best[:2], kp_h_best[:2])
    
    elif _visible(kp_n) and _visible(kp_s_best):
        virtual_below = (float(kp_s_best[0]), float(kp_s_best[1]) + abs(float(kp_n[1]) - float(kp_s_best[1])) * 1.5)
        angle_neck = _angle(kp_n[:2], kp_s_best[:2], virtual_below)
        neck_bust_only = True

   
    right_leg = _visible(kp_rh) and _visible(kp_rk) and _visible(kp_ra)
    left_leg  = _visible(kp_lh) and _visible(kp_lk) and _visible(kp_la)

    angle_legs: Optional[float] = None
    if right_leg and left_leg:
        cr = (float(kp_rh[2]) + float(kp_rk[2]) + float(kp_ra[2])) / 3
        cl = (float(kp_lh[2]) + float(kp_lk[2]) + float(kp_la[2])) / 3
        if cr >= cl:
            angle_legs = _angle(kp_rh[:2], kp_rk[:2], kp_ra[:2])
        else:
            angle_legs = _angle(kp_lh[:2], kp_lk[:2], kp_la[:2])
    elif right_leg:
        angle_legs = _angle(kp_rh[:2], kp_rk[:2], kp_ra[:2])
    elif left_leg:
        angle_legs = _angle(kp_lh[:2], kp_lk[:2], kp_la[:2])

    
    s_trunk,    desc_trunk    = _trunk_score(angle_trunk)
    s_neck,     desc_neck     = _neck_score(angle_neck, bust_only=neck_bust_only)
    s_legs,     desc_legs     = _legs_score(angle_legs)
    s_shoulder, desc_shoulder = _shoulder_asymmetry_score(kp_ls, kp_rs)

   
    key_a = (
        min(s_trunk, 5),
        min(s_neck,  3),
        min(s_legs,  4),
    )
    score_a = _TABLE_A.get(key_a, 9)   

    
    key_c = (min(score_a, 9), min(s_shoulder, 4))
    score_c = _TABLE_C.get(key_c, 12)  

   
    reba_score = max(1, min(score_c, 15))

    subscores = {
        "trunk":    {"score": s_trunk,    "desc": desc_trunk},
        "neck":     {"score": s_neck,     "desc": desc_neck},
        "legs":     {"score": s_legs,     "desc": desc_legs},
        "shoulder": {"score": s_shoulder, "desc": desc_shoulder},
        "group_a":  score_a,
    }

    angles = {}
    if angle_trunk is not None:
        angles["trunk_deg"]  = round(angle_trunk, 1)
    if angle_neck is not None:
        angles["neck_deg"]   = round(angle_neck, 1)
    if angle_legs is not None:
        angles["legs_deg"]   = round(angle_legs, 1)

    return RebaResult(
        score=reba_score,
        level=_reba_level(reba_score),
        subscores=subscores,
        angles=angles,
    )


# ---------------------------------------------------------------------------
# Utilitários de imagem
# ---------------------------------------------------------------------------
def decode_frame(frame_b64: str) -> np.ndarray:
    try:
        img_bytes = base64.b64decode(frame_b64)
    except Exception:
        raise ValueError("base64 inválido")
    arr   = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("não foi possível decodificar a imagem")
    return frame


# ---------------------------------------------------------------------------
# PoseAnalyzer
# ---------------------------------------------------------------------------
class PoseAnalyzer:
    """
    Detecta poses via YOLOv8 e classifica ergonomia com REBA heurístico.

    Saída por pessoa
    ----------------
    {
        "pessoa_id":           int,
        "bbox":                [x1, y1, x2, y2],
        "reba_score":          int,          # 1–15
        "reba_level":          str,          # "BAIXO" | "MÉDIO" | "ALTO"
        "reba_subscores":      dict,         # debug / log
        "angulos":             dict,         # graus calculados
        "confianca_deteccao":  float,
        "keypoints":           list,         # [[x, y, conf] × 17] para frontend
    }
    """

    def __init__(self, model_path: str | None = "yolov8n-pose.pt"):
        self.model_name = model_path or "yolov8n-pose.pt"
        self.model = YOLO(model_path) if model_path else None

   
    def analyze_from_results(self, results) -> list[dict]:
        """Processa resultados já computados do YOLO — não chama o modelo."""
        if not results or results[0].keypoints is None:
            return []

        result  = results[0]
        kps_all = result.keypoints.data
        boxes   = result.boxes
        pessoas = []

        for i, kps_tensor in enumerate(kps_all.cpu().numpy()):
            
            if boxes is not None and i < len(boxes):
                bbox     = list(map(int, boxes[i].xyxy[0].tolist()))
                conf_det = round(float(boxes[i].conf[0]), 4)
            else:
                bbox     = []
                conf_det = 0.0

            # REBA 
            reba: RebaResult = calculate_reba(kps_tensor)

            queda = detect_fall(kps_tensor, bbox)

            pessoas.append({
                "pessoa_id":          i,
                "bbox":               bbox,
                "reba_score":         reba.score,
                "reba_level":         reba.level,
                "reba_subscores":     reba.subscores,
                "angulos":            reba.angles,
                "queda":              queda,
                "confianca_deteccao": conf_det,
                "keypoints":          kps_tensor.tolist(),
            })

        return pessoas

    # ------------------------------------------------------------------
    def analyze(self, frame: np.ndarray) -> list[dict]:
        """Roda o modelo internamente — uso no Flask standalone."""
        if self.model is None:
            raise RuntimeError("modelo não carregado — use analyze_from_results()")
        results = self.model(frame, verbose=False)
        return self.analyze_from_results(results)