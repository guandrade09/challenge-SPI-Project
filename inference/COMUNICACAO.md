# Comunicação Entre Serviços — Do REST ao MQTT

## O Problema Atual

O código atual dos branches de ML usa HTTP REST para enviar incidentes ao backend:

```python
# ml_service/main.py — código atual em todos os branches ML
response = requests.post(
    "http://localhost:3000/api/detections",
    json=payload,
    timeout=2
)
```

Esse padrão funciona para persistência histórica (salvar no banco), mas tem problemas sérios para um sistema de tempo real com múltiplos dispositivos:

| Problema | Impacto |
|---|---|
| Cada POST abre e fecha uma conexão TCP | Overhead de ~10-50ms por envio |
| Payload JSON com imagem em Base64 | Frame de 640x480 vira ~200KB de texto |
| Se o backend estiver em outro dispositivo pela internet | Latência imprevisível, sem garantia de entrega |
| Se a internet cair | Alertas são perdidos silenciosamente |

---

## Qual Protocolo Usar em Cada Situação

### Situação 1 — Modelos no mesmo computador (containers Docker locais)

**Use: Filas Python nativas (`queue.Queue`)**

Quando os modelos de EPI, zona de perigo e ergonomia rodam no mesmo mini-PC, eles não precisam de nenhum protocolo de rede. A `queue.Queue` do Python é memória compartilhada — zero overhead de rede.

```
Container EPI ──┐
Container Zona ─┼──▶ queue.Queue ──▶ Aggregator ──▶ Ação local
Container Ergo ─┘
```

Velocidade: **< 1ms** de latência entre modelos.

---

### Situação 2 — Mini-PC enviando resultado para servidor central pela internet

**Use: MQTT (Mosquitto)**

MQTT foi criado para IoT exatamente para esse cenário: dispositivos na borda (mini-PCs) reportando eventos para um servidor central, mesmo em redes instáveis.

```
Mini-PC #1 (câmera entrada)     Mini-PC #2 (câmera esteira)
       │                                  │
       │ PUBLISH                          │ PUBLISH
       │ "spi/camera/1/alerta"            │ "spi/camera/2/alerta"
       ▼                                  ▼
┌─────────────────────────────────────────────────────┐
│              BROKER MQTT (Mosquitto)                │
│         Roda no servidor central ou na nuvem        │
└─────────────────────────────────────────────────────┘
                         │
                         │ SUBSCRIBE "spi/camera/#"
                         ▼
              Backend Node.js + Frontend React
```

**Vantagens do MQTT sobre REST nesse cenário:**
- **Persistência de mensagem:** Se o servidor cair por 5 minutos e voltar, o MQTT entrega as mensagens que ficaram na fila.
- **QoS (Quality of Service):** Você pode configurar o nível de garantia de entrega (0 = fire-and-forget, 1 = pelo menos uma vez, 2 = exatamente uma vez).
- **Leveza:** Pacote MQTT de alerta tem ~50 bytes. Pacote JSON via REST tem ~500 bytes + overhead HTTP.
- **Publicação/Assinatura:** O mini-PC publica uma mensagem e não precisa saber se tem 1 ou 10 subscribers — o broker cuida disso.

---

### Situação 3 — Ação imediata entre dois serviços (ex: catraca)

**Use: gRPC**

Quando o resultado da IA precisa acionar algo com baixíssima latência e a comunicação é ponto-a-ponto (modelo → atuador), use gRPC.

```
Modelo Facial ──▶ gRPC call ──▶ Serviço da Catraca
                               "liberar_acesso(pessoa_id=42)"
```

gRPC usa Protocol Buffers (binário) e conexão persistente HTTP/2. Latência típica: **2-5ms**.

Usar REST nesse caso adicionaria ~20-50ms de overhead desnecessário.

---

## Como Migrar o Código Atual para MQTT

### Passo 1 — Adicionar o broker Mosquitto via Docker

```yaml
# docker-compose.yml — adicionar serviço
services:
  mqtt-broker:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
```

```
# mosquitto.conf
listener 1883
allow_anonymous true
```

### Passo 2 — Substituir o POST REST por publish MQTT no ml_service

```python
# Antes (REST):
import requests
import threading

def post_incident(payload):
    requests.post("http://localhost:3000/api/detections", json=payload, timeout=2)

threading.Thread(target=post_incident, args=(payload,), daemon=True).start()
```

```python
# Depois (MQTT):
import paho.mqtt.client as mqtt
import json

# Inicializar uma vez, no início do programa
mqtt_client = mqtt.Client()
mqtt_client.connect("localhost", 1883)
mqtt_client.loop_start()  # thread de fundo, não bloqueia

# No loop principal, quando confirmar um incidente:
topic = f"spi/camera/{CAMERA_ID}/alerta"
mqtt_client.publish(topic, json.dumps({
    "camera_id": CAMERA_ID,
    "timestamp": timestamp.isoformat(),
    "status": "ALERTA",
    "label": detection.label,
    "confidence": round(float(detection.confidence), 4),
}))
# Não precisa de thread separada — publish() retorna imediatamente
```

### Passo 3 — Receber no Backend Node.js

```javascript
// backend/src/mqtt/subscriber.js
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
    client.subscribe('spi/camera/#'); // assina todos os tópicos de câmeras
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    // Mesmo processamento que o POST atual, mas sem criar rota HTTP
    createDetection(payload);
});
```

---

## A Imagem em Base64 — O Grande Vilão do Payload

O código atual envia a imagem do frame junto com cada alerta:

```python
_, buffer = cv2.imencode('.jpg', frame)
img_frame_b64 = base64.b64encode(buffer).decode('utf-8')  # ~200KB de texto
```

Isso é problemático via MQTT (que foi feito para mensagens pequenas) e lento via REST.

**Solução recomendada:** Separar o fluxo de dados em dois canais distintos.

```
Canal 1 — Tempo Real (MQTT):
  mini-PC → MQTT Broker → Backend
  Payload: apenas metadados do alerta (~100 bytes)
  {"camera_id": 1, "timestamp": "...", "label": "sem_capacete", "confidence": 0.87}

Canal 2 — Armazenamento de Evidência (REST/S3):
  mini-PC → POST multipart/form-data → Backend (ou storage S3)
  Payload: imagem JPEG do frame no momento do alerta
  Feito em thread de fundo, sem pressão de tempo real
```

O frontend exibe o alerta imediatamente via MQTT. A imagem de evidência aparece alguns segundos depois, quando o upload terminar.

---

## Comparativo Final

| Protocolo | Latência | Tamanho payload | Tolerância a falhas | Quando usar |
|---|---|---|---|---|
| `queue.Queue` Python | < 1ms | N/A (memória) | Apenas local | Modelos no mesmo processo |
| gRPC | 2-5ms | Binário compacto | Sem fila nativa | Ação direta ponto-a-ponto |
| WebSocket | 5-15ms | JSON/binário | Sem fila nativa | Streaming de vídeo para frontend |
| MQTT | 10-30ms | JSON pequeno | **Sim, com QoS** | Alertas mini-PC → servidor central |
| REST HTTP | 20-80ms | JSON + overhead | Não | Persistência histórica (banco) |
