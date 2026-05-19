# Guia de Performance e Boas Práticas de Inferência

## Por Que a Performance Importa Aqui

O sistema precisa tomar ações em tempo real. Para isso, o tempo entre a câmera capturar o frame e o sistema gerar uma ação precisa ficar **abaixo de 100ms** (o que o olho humano considera "instantâneo").

Com o código atual (antes das correções), o pipeline por frame está estimado em:

| Etapa | Tempo estimado (CPU sem GPU) |
|---|---|
| Captura do frame | ~5ms |
| Inferência YOLO `.pt` | ~80-120ms |
| Segunda inferência (bug) | ~80-120ms |
| `winsound.Beep` (bloqueia) | 300ms por alerta |
| Encode JPEG + WebSocket | ~10ms |
| **Total (sem alerta)** | **~175-255ms (~4-6 FPS)** |
| **Total (com alerta)** | **~475-555ms (~2 FPS)** |

Com as correções aplicadas e ONNX:

| Etapa | Tempo estimado (com ONNX, CPU) |
|---|---|
| Captura do frame (thread separado) | paralelo, não conta |
| Inferência ONNX | ~25-40ms |
| Segunda inferência | eliminada |
| Beep (thread separado) | paralelo, não conta |
| Encode JPEG + WebSocket | ~10ms |
| **Total estimado** | **~35-50ms (~20-28 FPS)** |

---

## 1. Conversão para ONNX

### Por que converter

O formato `.pt` (PyTorch) contém dados usados apenas no treinamento: gradientes, estados do otimizador e layers de Dropout. Em inferência, tudo isso é peso morto. O ONNX remove o que não é necessário e aplica otimizações matemáticas (fusão de layers, quantização).

### Como converter (um único comando)

```python
# export_onnx.py — rodar uma vez antes de colocar em produção
from ultralytics import YOLO

model = YOLO("ml_service/vision/models/best.pt")
model.export(format="onnx", dynamic=False, simplify=True)
# Gera: ml_service/vision/models/best.onnx
```

### Como carregar o modelo ONNX no detector

```python
# detector.py — substituir carregamento do YOLO
from ultralytics import YOLO

# Antes:
self.model = YOLO("best.pt")

# Depois (usa ONNX internamente via ultralytics):
self.model = YOLO("best.onnx")
# O ultralytics detecta o .onnx e usa o ONNX Runtime automaticamente
```

---

## 2. Separar Captura e Inferência em Threads

### Por que separar

Com tudo no mesmo thread, a câmera fica parada durante a inferência. Se a inferência leva 40ms, a câmera efetiva fica a 25 FPS mesmo que ela possa entregar 30 FPS. Com threads separados, a câmera captura continuamente enquanto o modelo processa o frame anterior.

### Implementação

```python
import queue
import threading

def make_capture_thread(camera, frame_q: queue.Queue) -> threading.Thread:
    def _loop():
        while camera.is_opened():
            ret, frame = camera.read()
            if not ret:
                break
            # Se a fila está cheia, descarta o frame mais antigo
            # Isso garante que a inferência sempre vê o frame mais recente
            if frame_q.full():
                try:
                    frame_q.get_nowait()
                except queue.Empty:
                    pass
            frame_q.put(frame)

    t = threading.Thread(target=_loop, daemon=True)
    t.start()
    return t

# No main:
frame_queue = queue.Queue(maxsize=2)
make_capture_thread(camera, frame_queue)

while True:
    frame = frame_queue.get()  # bloqueia até ter um frame novo
    # ... inferência aqui ...
```

**Por que `maxsize=2`?** Com maxsize=2, a fila nunca acumula frames antigos. Se a inferência atrasar, ela processa o frame mais recente disponível, não um frame de 5 segundos atrás. Isso mantém o sistema responsivo mesmo sob carga.

---

## 3. Corrigir a Inferência Dupla

Esta é a mudança mais simples e de maior impacto. Ver detalhes em [ISSUES_POR_BRANCH.md](./ISSUES_POR_BRANCH.md) — Bug #1.

**Resumo:** O `main.py` chama `detector.model(frame)` e depois `detector.run(frame)`, que chama `self.model(frame)` de novo. Trocar `run()` por um método `parse()` que recebe o resultado já calculado resolve completamente.

---

## 4. Pool de POST HTTP

Ver [ISSUES_POR_BRANCH.md](./ISSUES_POR_BRANCH.md) — Bug #3. Não criar uma thread nova por incidente; usar uma fila com um único worker em background.

---

## 5. Reduzir Resolução de Entrada (Se Necessário)

A câmera está configurada para 1280x720:

```python
camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
```

O YOLOv8 interno redimensiona a imagem para 640x640 antes de rodar. Enviar 1280x720 significa que o OpenCV faz um resize antes de passar para o modelo. Configurar a câmera para 640x480 já reduz o trabalho de resize e o uso de memória sem perda relevante de acurácia para detecção de EPIs.

```python
# Ajuste recomendado para hardware com CPU (sem GPU)
camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
```

---

## 6. Usar YOLOv8n (nano) Como Ponto de Partida

Se o hardware for um mini-PC sem GPU, usar a variante `yolov8n` (nano) em vez de `yolov8s` ou `yolov8m`. O nano é ~5x mais rápido com acurácia levemente inferior — aceitável para detecção de EPIs em câmera próxima.

| Variante | Parâmetros | Velocidade CPU | mAP50 |
|---|---|---|---|
| yolov8n | 3.2M | ~25ms/frame | 37.3 |
| yolov8s | 11.2M | ~55ms/frame | 44.9 |
| yolov8m | 25.9M | ~115ms/frame | 50.2 |

Para retreinar com a variante nano:
```python
from ultralytics import YOLO
model = YOLO("yolov8n.pt")  # base nano
model.train(data="data.yaml", epochs=100)
```

---

## 7. Benchmark: Como Medir o Tempo Real de Inferência

Antes e depois de qualquer otimização, meça com código, não com estimativas:

```python
import time

times = []
for _ in range(100):  # 100 frames de teste
    start = time.perf_counter()
    results = detector.model(frame, conf=0.5, verbose=False)
    elapsed = (time.perf_counter() - start) * 1000  # ms
    times.append(elapsed)

avg = sum(times) / len(times)
print(f"Média: {avg:.1f}ms | Min: {min(times):.1f}ms | Max: {max(times):.1f}ms")
print(f"FPS estimado: {1000/avg:.1f}")
```

---

## Checklist de Performance

- [ ] Modelo convertido para ONNX (`.pt` → `.onnx`)
- [ ] Inferência dupla removida (`run()` → `parse()`)
- [ ] Captura e inferência em threads separados
- [ ] `winsound.Beep` em thread separado
- [ ] POST HTTP usando fila com worker único
- [ ] Resolução da câmera ajustada para o hardware disponível
- [ ] Benchmark rodado antes e depois para validar melhorias
