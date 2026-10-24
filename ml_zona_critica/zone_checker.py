import base64
import numpy as np
import cv2
from ultralytics import YOLO
from shapely.geometry import Point, Polygon

# Pontos que representam a posição da pessoa pra checagem de invasão (não "qualquer
# keypoint dentro conta") — evita falso positivo de braço/mão esticados sobre a zona sem a
# pessoa estar realmente lá. Basta UM tornozelo ou UM ombro dentro: pisar na zona com um pé
# ou entrar com o tronco já é invasão (o ponto médio entre os dois tornozelos ficava fora
# nesse caso e a invasão não era detectada). Sem tornozelo nem ombro visível: quadris →
# centro da bounding box. Cotovelos e pulsos nunca contam.
IDX_OMBRO_ESQ     = 5
IDX_OMBRO_DIR     = 6
IDX_TORNOZELO_ESQ = 15
IDX_TORNOZELO_DIR = 16
IDX_QUADRIL_ESQ   = 11
IDX_QUADRIL_DIR   = 12

KP_CONF_THRESHOLD = 0.2


def _ponto_medio_valido(kps: np.ndarray, idx_a: int, idx_b: int) -> tuple[float, float] | None:
    """Centro dos dois keypoints se ambos tiverem confiança suficiente; usa só o que
    tiver se um estiver oculto; None se nenhum — sinaliza pro próximo nível de fallback."""
    a, b = kps[idx_a], kps[idx_b]
    a_ok = float(a[2]) >= KP_CONF_THRESHOLD
    b_ok = float(b[2]) >= KP_CONF_THRESHOLD
    if a_ok and b_ok:
        return (float(a[0]) + float(b[0])) / 2, (float(a[1]) + float(b[1])) / 2
    if a_ok:
        return float(a[0]), float(a[1])
    if b_ok:
        return float(b[0]), float(b[1])
    return None


def _pontos_referencia(kps: np.ndarray, bbox: list) -> tuple[list[tuple[float, float]], str | None]:
    """Pontos (x, y) usados pra decidir invasão — invadiu se QUALQUER um estiver dentro — e
    de onde vieram (informativo). Ordem: cada tornozelo e ombro visível → quadris → centro
    da bbox."""
    nomes = {IDX_TORNOZELO_ESQ: "tornozelos", IDX_TORNOZELO_DIR: "tornozelos",
             IDX_OMBRO_ESQ: "ombros", IDX_OMBRO_DIR: "ombros"}
    visiveis = [i for i in nomes if float(kps[i][2]) >= KP_CONF_THRESHOLD]
    if visiveis:
        origem = "+".join(sorted({nomes[i] for i in visiveis}, reverse=True))
        return [(float(kps[i][0]), float(kps[i][1])) for i in visiveis], origem
    ponto = _ponto_medio_valido(kps, IDX_QUADRIL_ESQ, IDX_QUADRIL_DIR)
    if ponto is not None:
        return [ponto], "quadris"
    if len(bbox) == 4:
        x1, y1, x2, y2 = bbox
        return [((x1 + x2) / 2, (y1 + y2) / 2)], "bbox"
    return [], None


def decode_frame(frame_b64: str) -> np.ndarray:
    try:
        img_bytes = base64.b64decode(frame_b64)
    except Exception:
        raise ValueError("base64 invalido")
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("nao foi possivel decodificar a imagem")
    return frame


class ZoneChecker:
    def __init__(self, model_path: str | None = "yolov8n-pose.pt"):
        self.model_name = model_path or "yolov8n-pose.pt"
        self.model      = YOLO(model_path) if model_path else None
        self._zones: dict[str, dict] = {}

    def configure(self, camera_id: str, nome: str, pontos: list[dict],
                   epis_obrigatorios: list[str] | None = None,
                   epis_certo_labels: list[str] | None = None) -> None:
        coords = [(p["x"], p["y"]) for p in pontos]
        polygon = Polygon(coords)
        if not polygon.is_valid:
            raise ValueError("poligono invalido (auto-intersectante ou degenerado)")
        self._zones[camera_id] = {
            "nome":              nome,
            "pontos":            pontos,
            "polygon":           polygon,
            "epis_obrigatorios": epis_obrigatorios or [],   # ex: ["capacete", "colete"]
            "epis_certo_labels": epis_certo_labels or [],   # ex: ["CAPACETE - CERTO"]
        }

    def get(self, camera_id: str) -> dict | None:
        zone = self._zones.get(camera_id)
        if zone is None:
            return None
        return {
            "nome":              zone["nome"],
            "pontos":            zone["pontos"],
            "epis_obrigatorios": zone.get("epis_obrigatorios", []),
            "epis_certo_labels": zone.get("epis_certo_labels", []),
            **({"areas": zone["config_areas"]} if "config_areas" in zone else {}),
        }

    def configure_areas(self, camera_id: str, areas: list[dict]) -> None:
        if not 1 <= len(areas) <= 4:
            raise ValueError("configure de 1 a 4 áreas por câmera")
        prepared, configs, ids = [], [], set()
        validator = ZoneChecker(model_path=None)
        for area in areas:
            area_id = area["id"]
            if type(area_id) is not int or not 1 <= area_id <= 4 or area_id in ids:
                raise ValueError("identificador de área inválido ou repetido")
            ids.add(area_id)
            validator.configure(camera_id, area["nome"], area["pontos"],
                                area.get("epis_obrigatorios"), area.get("epis_certo_labels"))
            prepared.append({**validator._zones[camera_id], "area_id": area_id})
            configs.append({**validator.get(camera_id), "id": area_id,
                            **({"box": area["box"]} if "box" in area else {})})
        self._zones[camera_id] = {**prepared[0], "areas": prepared, "config_areas": configs}

    def delete(self, camera_id: str) -> bool:
        return self._zones.pop(camera_id, None) is not None

    def check_from_results(self, camera_id: str, results) -> tuple[str, list[dict]]:
        """Processa resultados já computados do YOLO — não chama o modelo."""
        zone = self._zones.get(camera_id)
        if zone is None:
            raise KeyError(f"camera '{camera_id}' sem zona configurada")

        people = []
        for area in zone.get("areas", [zone]):
            _, checked = self._check_zone_results(area, results)
            for person in checked:
                people.append({**person, "area_id": area.get("area_id", 1),
                               "nome": area["nome"], "pontos": area["pontos"]})
        return zone["nome"], people

    def _check_zone_results(self, zone, results):

        if not results or results[0].keypoints is None:
            return zone["nome"], []

        polygon: Polygon = zone["polygon"]
        result   = results[0]
        kps_all  = result.keypoints.data
        boxes    = result.boxes
        pessoas  = []

        epis_certo  = zone.get("epis_certo_labels", [])
        epis_obrig  = zone.get("epis_obrigatorios", [])

        for i, kps in enumerate(kps_all.cpu().numpy()):
            if boxes is not None and i < len(boxes):
                bbox = list(map(float, boxes[i].xyxy[0].tolist()))
            else:
                bbox = []

            pontos, origem = _pontos_referencia(kps, bbox)
            invadiu = any(polygon.contains(Point(x, y)) for x, y in pontos)

            pessoas.append({
                "pessoa_id":         i,
                "invadiu":           invadiu,
                "keypoints_dentro":  [origem] if invadiu else [],
                "epis_obrigatorios": epis_obrig,    # passa para o orquestrador cruzar com EPI detector
                "epis_certo_labels": epis_certo,
            })

        return zone["nome"], pessoas

    def check(self, camera_id: str, frame: np.ndarray) -> tuple[str, list[dict]]:
        """Roda o modelo internamente — uso no Flask standalone."""
        if self.model is None:
            raise RuntimeError("modelo não carregado — use check_from_results()")
        results = self.model(frame, verbose=False)
        return self.check_from_results(camera_id, results)
