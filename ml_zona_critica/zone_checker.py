import base64
import numpy as np
import cv2
from ultralytics import YOLO
from shapely.geometry import Point, Polygon

KEYPOINTS_CHECK = {
    "tornozelo_esq": 15,
    "tornozelo_dir": 16,
    "quadril_esq":   11,
    "quadril_dir":   12,
}

KP_CONF_THRESHOLD = 0.3


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

    def configure(self, camera_id: str, nome: str, pontos: list[dict]) -> None:
        coords = [(p["x"], p["y"]) for p in pontos]
        polygon = Polygon(coords)
        if not polygon.is_valid:
            raise ValueError("poligono invalido (auto-intersectante ou degenerado)")
        self._zones[camera_id] = {
            "nome": nome,
            "pontos": pontos,
            "polygon": polygon,
        }

    def get(self, camera_id: str) -> dict | None:
        zone = self._zones.get(camera_id)
        if zone is None:
            return None
        return {"nome": zone["nome"], "pontos": zone["pontos"]}

    def delete(self, camera_id: str) -> bool:
        return self._zones.pop(camera_id, None) is not None

    def check_from_results(self, camera_id: str, results) -> tuple[str, list[dict]]:
        """Processa resultados já computados do YOLO — não chama o modelo."""
        zone = self._zones.get(camera_id)
        if zone is None:
            raise KeyError(f"camera '{camera_id}' sem zona configurada")

        if not results or results[0].keypoints is None:
            return zone["nome"], []

        polygon: Polygon = zone["polygon"]
        kps_all  = results[0].keypoints.data
        pessoas  = []

        for i, kps in enumerate(kps_all.cpu().numpy()):
            kps_dentro = []
            for nome_kp, idx in KEYPOINTS_CHECK.items():
                kp = kps[idx]
                if float(kp[2]) >= KP_CONF_THRESHOLD:
                    if polygon.contains(Point(float(kp[0]), float(kp[1]))):
                        kps_dentro.append(nome_kp)

            pessoas.append({
                "pessoa_id":       i,
                "invadiu":         len(kps_dentro) > 0,
                "keypoints_dentro": kps_dentro,
            })

        return zone["nome"], pessoas

    def check(self, camera_id: str, frame: np.ndarray) -> tuple[str, list[dict]]:
        """Roda o modelo internamente — uso no Flask standalone."""
        if self.model is None:
            raise RuntimeError("modelo não carregado — use check_from_results()")
        results = self.model(frame, verbose=False)
        return self.check_from_results(camera_id, results)
