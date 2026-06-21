# Orquestrador — Pipeline Unificado de Visão Computacional

O orquestrador é o **cérebro do sistema**. Ele captura frames da câmera, distribui para os três detectores em paralelo, combina os resultados num único veredicto e transmite tudo ao frontend via WebSocket.

## Por que o orquestrador existe

Antes da Fase 2, o `ml_service` só detectava EPIs. Cada câmera precisaria de um serviço separado por tipo de análise, sem nenhuma coordenação entre eles. O orquestrador resolve isso: **um único processo, uma única câmera, três análises por frame, um veredicto**.

## Arquitetura

```
Câmera (OpenCV)
    │ frame
    ▼
┌─────────────────────────────────────────────┐
│               ORQUESTRADOR                  │
│                                             │
│  Thread captura ──▶ queue.Queue(maxsize=2)  │
│                           │                 │
│                    ┌──────▼──────┐          │
│  EPIDetector ──────┤             │          │
│  PoseAnalyzer ─────┤  Aggregator │          │
│  ZoneChecker ──────┤             │          │
│                    └──────┬──────┘          │
│                           │ Verdict         │
└───────────────────────────┼─────────────────┘
                            │
              ┌─────────────┴──────────────┐
              ▼                            ▼
       WebSocket :8765              POST /api/detections
       (frontend ao vivo)           (backend Node.js)
```

## Módulos utilizados

| Módulo | Origem | O que faz |
|---|---|---|
| `EPIDetector` | `ml_service/inference/detector.py` | Detecta EPIs com modelo customizado `best.pt` |
| `PoseAnalyzer` | `ml_ergonomia/pose_analyzer.py` | Analisa postura via ângulos corporais (YOLOv8 Pose) |
| `ZoneChecker` | `ml_zona_critica/zone_checker.py` | Verifica invasão de área restrita (YOLOv8 Pose + Shapely) |
| `Aggregator` | `orquestrador/aggregator.py` | Combina os três resultados em um único `Verdict` |

## Veredictos possíveis

| Status | Condição |
|---|---|
| `MONITORANDO` | Nenhum risco detectado |
| `ALERTA_EPI` | EPI ausente confirmado por N frames |
| `ALERTA_ERGONOMIA` | Postura de risco confirmada por N frames |
| `ALERTA_ZONA` | Pessoa em área restrita |
| `ALERTA_MULTIPLO` | Mais de um risco simultâneo |

## Melhorias aplicadas sobre o ml_service original

| Bug | Era | Agora |
|---|---|---|
| Inferência dupla | `detector.model()` + `detector.run()` = YOLO 2x | `parse()` reutiliza resultado já calculado |
| winsound bloqueia | `winsound.Beep()` parava o loop 300ms | Thread separada, cross-platform |
| Thread por POST | Nova thread a cada incidente | `queue.Queue` com worker único |
| Captura + inferência juntas | Câmera parava enquanto modelo processava | Thread de captura separada com `queue.Queue(maxsize=2)` |

## Como rodar

```bash
cd challenge-SPI-Project
pip install -r ml_service/requirements.txt
pip install -r ml_ergonomia/requirements.txt
pip install -r ml_zona_critica/requirements.txt

python orquestrador/main.py
```

## Configurar zona de risco antes de rodar

A zona de risco precisa ser definida com as coordenadas do polígono na imagem da câmera (em pixels):

```python
# orquestrador/main.py — editar antes de rodar
ZONA_CONFIG = {
    "camera_id": "cam_01",
    "nome":      "Área da prensa",
    "pontos": [
        {"x": 100, "y": 150},
        {"x": 400, "y": 150},
        {"x": 400, "y": 500},
        {"x": 100, "y": 500},
    ]
}
```
