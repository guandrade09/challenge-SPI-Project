# ml_ergonomia — Microsserviço de Análise de Postura

Serviço Flask independente (porta **5001**) que recebe um frame em base64 e retorna a classificação postural de cada pessoa detectada usando YOLOv8 Pose.

## Como funciona

Roda YOLOv8 Pose no frame e calcula dois ângulos por pessoa usando keypoints do padrão COCO:

| Ângulo | Keypoints | Índices |
|---|---|---|
| Coluna | ombro_dir → quadril_dir → joelho_dir | 6, 12, 14 |
| Pescoço | nariz → ombro_dir → quadril_dir | 0, 6, 12 |

Também verifica assimetria de ombros (diferença de altura entre kp 5 e kp 6).

## Classes de saída

| Classe | Condição |
|---|---|
| `adequada` | Todos os ângulos dentro dos limites |
| `ergonomicamente_inadequada` | Coluna entre 120°–160°, ou pescoço < 145°, ou assimetria de ombros > 20px |
| `risco_imediato` | Coluna < 120° (curvatura severa) |

## Instalação e execução

```bash
cd ml_ergonomia
pip install -r requirements.txt
python app.py
```

O modelo `yolov8n-pose.pt` é baixado automaticamente pelo ultralytics na primeira execução.

## Endpoints

### GET /ergonomia/status
```bash
curl http://localhost:5001/ergonomia/status
# {"status": "ok", "modelo": "yolov8n-pose.pt"}
```

### POST /ergonomia/analisar
```bash
curl -X POST http://localhost:5001/ergonomia/analisar \
  -H "Content-Type: application/json" \
  -d '{"frame": "<base64>"}'
```

Resposta:
```json
{
  "pessoas": [
    {
      "pessoa_id": 0,
      "bbox": [120, 80, 380, 620],
      "classe": "risco_imediato",
      "angulos": { "coluna": 118.4, "pescoco": 141.2 },
      "confianca_deteccao": 0.91
    }
  ],
  "total_em_risco": 1,
  "latencia_ms": 52.3
}
```

## Uso no orquestrador

Este serviço pode ser chamado via HTTP ou importado diretamente como módulo Python:

```python
# importação direta (sem HTTP — recomendado no orquestrador)
import sys
sys.path.insert(0, "ml_ergonomia")
from pose_analyzer import PoseAnalyzer

analyzer = PoseAnalyzer("yolov8n-pose.pt")
resultado = analyzer.analyze(frame)  # recebe np.ndarray, retorna list[dict]
```
