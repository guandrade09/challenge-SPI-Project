# Problemas Identificados por Branch de ML

Este documento lista os bugs e más práticas encontrados em cada branch de machine learning, com o código problemático e a correção recomendada.

---

## Problemas Comuns a `ml/epi`, `ml/riscoergonomico` e `ml/zonadeperigo`

Esses três branches têm **exatamente o mesmo `main.py` e `detector.py`**, então os problemas abaixo afetam todos eles.

---

### BUG #1 — Inferência Dupla por Frame (Impacto: CRÍTICO)

**Onde:** `ml_service/main.py` + `ml_service/inference/detector.py`

**O problema:**

```python
# main.py — linha ~38 e ~41
results = detector.model(frame, conf=detector.conf, verbose=False)  # 1ª passagem
result  = results[0]

detections = detector.run(frame)  # 2ª passagem (chama self.model() internamente)
```

```python
# detector.py — método run()
def run(self, frame) -> list[Detection]:
    results = self.model(frame, ...)  # roda a rede neural de novo
    ...
```

O frame passa pelo YOLO **duas vezes** a cada iteração do loop. Isso dobra o tempo de processamento por frame sem nenhum benefício. Se cada inferência leva 50ms, o loop fica a 10 FPS em vez de 20 FPS.

**Correção:**

```python
# main.py corrigido
raw_results = detector.model(frame, conf=detector.conf, verbose=False)
detections  = detector.parse(raw_results)   # só faz o parse, não roda o modelo
incidents   = detector.incidents(detections)
confirmed   = debouncer.update(incidents)
annotated_frame = raw_results[0].plot()     # usa o resultado já calculado
```

```python
# detector.py corrigido — substituir run() por parse()
def parse(self, results) -> list[Detection]:
    detections = []
    for result in results:
        for box in result.boxes:
            label      = result.names[int(box.cls[0])]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            detections.append(Detection(label, confidence, x1, y1, x2, y2))
    return detections
```

---

### BUG #2 — `winsound.Beep` Bloqueia o Loop Principal (Impacto: ALTO)

**Onde:** `ml_service/main.py`

**O problema:**

```python
winsound.Beep(1000, 300)  # pausa TUDO por 300 milissegundos
```

Durante esses 300ms, nenhum frame é capturado nem processado. Com 30 FPS, o sistema perde 9 frames a cada alerta.

Além disso: `winsound` só existe no Windows. Isso quebra o código em Linux (onde os mini-PCs de produção provavelmente rodarão).

**Correção:**

```python
# Mover o beep para uma thread separada e usar solução cross-platform
import threading

def _beep():
    try:
        import winsound
        winsound.Beep(1000, 300)
    except ImportError:
        # Linux/Mac: usa o terminal bell ou omite
        print("\a", end="", flush=True)

threading.Thread(target=_beep, daemon=True).start()
```

---

### BUG #3 — Thread por Incidente para POST HTTP (Impacto: MÉDIO)

**Onde:** `ml_service/main.py`

**O problema:**

```python
for detection in confirmed:
    # Cria uma nova thread para cada detecção confirmada
    threading.Thread(target=post_incident, args=(payload,), daemon=True).start()
```

Se 5 alertas forem confirmados no mesmo segundo, 5 threads são criadas ao mesmo tempo. Criar e destruir threads tem custo. Em situações de alta frequência de alertas isso pode sobrecarregar o sistema.

**Correção:** Usar uma fila (`queue.Queue`) com um único thread de envio que já existe em background.

```python
# No início do programa, cria uma fila e um worker único
import queue

_post_queue = queue.Queue()

def _post_worker():
    while True:
        payload = _post_queue.get()
        post_incident(payload)
        _post_queue.task_done()

threading.Thread(target=_post_worker, daemon=True).start()

# No loop principal, apenas enfileira
_post_queue.put(payload)  # não cria thread nova
```

---

### BUG #4 — Captura e Inferência no Mesmo Thread (Impacto: MÉDIO)

**Onde:** `ml_service/main.py` — loop principal

**O problema:**

```python
while camera.is_opened():
    ret, frame = camera.read()    # espera o frame
    # ... processa o frame ...    # enquanto processa, câmera não captura
```

Se a inferência leva 80ms, a câmera fica parada 80ms esperando. Isso limita o FPS efetivo ao tempo de inferência, mesmo que a câmera consiga entregar 30 FPS.

**Correção:** Separar em dois threads com uma fila entre eles.

```python
import queue
import threading

frame_queue = queue.Queue(maxsize=2)  # maxsize=2 descarta frames velhos automaticamente

def capture_loop(camera: Camera, q: queue.Queue):
    while camera.is_opened():
        ret, frame = camera.read()
        if not ret:
            break
        if q.full():
            q.get_nowait()  # descarta frame antigo
        q.put(frame)

# Thread 1: só captura
t = threading.Thread(target=capture_loop, args=(camera, frame_queue), daemon=True)
t.start()

# Thread principal: só processa
while True:
    frame = frame_queue.get()
    # ... inferência aqui ...
```

---

### PROBLEMA #5 — Labels Inconsistentes Entre Branches (Impacto: ALTO para integração)

**Onde:** `core/entities.py`

**O problema:**

```python
# ml/camera e ml/epi — labels em português
RISK_LABELS = ["sem_capacete", "sem_colete", "sem_oculos"]

# ml/zonadeperigo — labels em inglês (provavelmente do dataset Roboflow)
RISK_LABELS = {"NO-Hardhat", "NO-Mask", "NO-Safety Vest"}
```

Quando o Aggregator tentar unificar os resultados de `ml/epi` e `ml/zonadeperigo`, os labels não vão casar. O sistema vai tratar `"sem_capacete"` e `"NO-Hardhat"` como riscos diferentes quando são o mesmo risco.

**Correção:** Padronizar os labels em um único lugar antes da integração. Sugestão: definir um enum ou constante central no módulo `core/entities.py` que todos os branches usem.

```python
# core/entities.py — versão unificada proposta
from enum import Enum

class RiskLabel(str, Enum):
    SEM_CAPACETE    = "sem_capacete"
    SEM_COLETE      = "sem_colete"
    SEM_OCULOS      = "sem_oculos"
    ZONA_PERIGO     = "zona_perigo"
    RISCO_ERGO      = "risco_ergonomico"

# Mapeamento de labels do modelo para o padrão do sistema
LABEL_MAP = {
    # Labels do modelo EPI (português)
    "sem_capacete":      RiskLabel.SEM_CAPACETE,
    "sem_colete":        RiskLabel.SEM_COLETE,
    "sem_oculos":        RiskLabel.SEM_OCULOS,
    # Labels do dataset Roboflow (inglês)
    "NO-Hardhat":        RiskLabel.SEM_CAPACETE,
    "NO-Safety Vest":    RiskLabel.SEM_COLETE,
    "NO-Mask":           RiskLabel.SEM_OCULOS,
}
```

---

## Resumo dos Problemas por Branch

| Branch | Bug #1 (Dupla inferência) | Bug #2 (winsound) | Bug #3 (threads) | Bug #4 (capture/infer) | Bug #5 (labels) |
|---|---|---|---|---|---|
| `ml/camera` | Não tem (código simples) | Não tem | Não tem | Não tem | Labels PT |
| `ml/epi` | **SIM** | **SIM** | **SIM** | **SIM** | Labels PT |
| `ml/riscoergonomico` | **SIM** | **SIM** | **SIM** | **SIM** | Labels PT |
| `ml/zonadeperigo` | **SIM** | **SIM** | **SIM** | **SIM** | Labels EN |
| `ml/settings` | Não tem (só dataset) | — | — | — | — |

---

## Prioridade de Correção

1. **Bug #1** — Corrigir primeiro. Ganho imediato de ~2x na velocidade sem nenhum custo.
2. **Bug #5** — Corrigir antes de implementar o Aggregator, pois afeta toda a integração.
3. **Bug #4** — Corrigir para liberar o FPS real da câmera.
4. **Bug #2** — Corrigir para garantir portabilidade entre Windows e Linux.
5. **Bug #3** — Corrigir para estabilidade em alta carga.
