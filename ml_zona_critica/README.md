# ml_zona_critica — Microsserviço de Detecção de Invasão de Área

Serviço Flask independente (porta **5002**) que recebe um frame em base64, detecta pessoas via YOLOv8 Pose e verifica se tornozelos ou quadris de alguma pessoa estão dentro de um polígono configurável por câmera.

## Como funciona

Não tem ML próprio para classificar risco — usa geometria pura via **Shapely**. O YOLOv8 Pose localiza as pessoas e extrai os keypoints; o Shapely verifica se os pontos estão dentro do polígono configurado.

**Keypoints verificados por pessoa:**

| Nome | Keypoint COCO | Índice |
|---|---|---|
| `tornozelo_esq` | left_ankle | 15 |
| `tornozelo_dir` | right_ankle | 16 |
| `quadril_esq` | left_hip | 11 |
| `quadril_dir` | right_hip | 12 |

Se qualquer um desses pontos estiver dentro do polígono → `"invadiu": true`.

## Instalação e execução

```bash
cd ml_zona_critica
pip install -r requirements.txt
python app.py
```

## Endpoints

### GET /zona/status
```bash
curl http://localhost:5002/zona/status
# {"status": "ok", "modelo": "yolov8n-pose.pt"}
```

### POST /zona/configurar — define ou atualiza zona de uma câmera
```bash
curl -X POST http://localhost:5002/zona/configurar \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": "cam_01",
    "nome": "Área da prensa",
    "pontos": [
      {"x": 100, "y": 150},
      {"x": 400, "y": 150},
      {"x": 400, "y": 500},
      {"x": 100, "y": 500}
    ]
  }'
# {"ok": true, "camera_id": "cam_01"}
```

### GET /zona/configurar/\<camera_id\> — consulta zona configurada
```bash
curl http://localhost:5002/zona/configurar/cam_01
```

### DELETE /zona/configurar/\<camera_id\> — remove zona
```bash
curl -X DELETE http://localhost:5002/zona/configurar/cam_01
```

### POST /zona/verificar — verifica invasão no frame
```bash
curl -X POST http://localhost:5002/zona/verificar \
  -H "Content-Type: application/json" \
  -d '{"camera_id": "cam_01", "frame": "<base64>"}'
```

Resposta:
```json
{
  "camera_id": "cam_01",
  "zona": "Área da prensa",
  "pessoas": [
    {
      "pessoa_id": 0,
      "invadiu": true,
      "keypoints_dentro": ["tornozelo_esq", "quadril_esq"]
    }
  ],
  "alerta": true,
  "latencia_ms": 4.1
}
```

## Zonas ficam em memória

As zonas configuradas via POST são armazenadas em memória (dicionário Python). Se o serviço reiniciar, as zonas precisam ser reconfiguradas. Para persistência, o time de backend pode futuramente salvar as zonas no SQLite e recarregá-las na inicialização.

## Uso no orquestrador

```python
# importação direta (sem HTTP — recomendado no orquestrador)
import sys
sys.path.insert(0, "ml_zona_critica")
from zone_checker import ZoneChecker

checker = ZoneChecker("yolov8n-pose.pt")
checker.configure("cam_01", "Área da prensa", [
    {"x": 100, "y": 150}, {"x": 400, "y": 150},
    {"x": 400, "y": 500}, {"x": 100, "y": 500},
])

nome_zona, pessoas = checker.check("cam_01", frame)  # frame: np.ndarray
```
