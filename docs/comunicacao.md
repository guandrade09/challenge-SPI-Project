# Comunicação entre Orquestrador, Backend e Frontend

Mapa completo de quem fala com quem, em qual protocolo e com qual formato JSON.

---

## Visão geral

```
Câmeras ──► Orquestrador ─────────────────────────────► Frontend
(RTSP/HTTP)    │        WebSocket ws://localhost:8765
               │        (frame, frame_lateral, detections,
               │         pose, verdict, alert, queda, metrics)
               │
               │  GET /api/cameras    (startup + a cada 15s)
               │  GET /api/zonas/:id  (startup)
               ◄──────────────────── Backend :3000
               │
               │  POST /api/detections  (só em alerta confirmado)
               └─────────────────────► Backend :3000
                                            │
                                          SQLite
```

**Regra geral:**
- **Orquestrador → Backend** via HTTP REST (lê câmeras/zonas, grava detections)
- **Orquestrador → Frontend** via WebSocket (tudo que é ao vivo: frames, pose, veredito)
- O backend **não interfere** no streaming ao vivo — é só persistência e configuração

---

## 1. Orquestrador lê do Backend

### `GET /api/cameras`

Chamado no startup e a cada 15 segundos para descobrir onde estão as câmeras cadastradas pelo frontend. O orquestrador usa o campo `papel` para saber qual é frontal e qual é lateral.

**Resposta do backend:**
```json
{
  "count": 2,
  "data": [
    {
      "id": 1,
      "nome": "Quarto Frontal",
      "setor": "Produção",
      "ip": "192.168.15.7",
      "streamUrl": "rtsp://admin:senha@192.168.15.7:554/onvif1",
      "status": "active",
      "epis": ["CAPACETE", "COLETE"],
      "papel": "frontal",
      "createdAt": "2026-08-15T14:00:00.000Z",
      "updatedAt": "2026-08-15T14:00:00.000Z"
    },
    {
      "id": 2,
      "nome": "Cozinha Lateral",
      "setor": "Produção",
      "ip": "192.168.15.2",
      "streamUrl": "rtsp://admin:senha@192.168.15.2:554/onvif1",
      "status": "active",
      "epis": [],
      "papel": "lateral",
      "createdAt": "2026-08-15T14:05:00.000Z",
      "updatedAt": "2026-08-15T14:05:00.000Z"
    }
  ]
}
```

O orquestrador pega `data[].streamUrl` de quem tem `papel: "frontal"` e `papel: "lateral"`.  
Se nenhuma câmera estiver cadastrada, cai no fallback: webcam local (índice `0`) sem lateral.

---

### `GET /api/zonas/:camera_id`

Chamado uma vez no startup para carregar a configuração da zona de risco (polígono + EPIs obrigatórios) da câmera especificada.

**Resposta do backend:**
```json
{
  "camera_id": "cam_1",
  "nome": "Zona Crítica Linha A",
  "pontos": [
    { "x": 120, "y": 80 },
    { "x": 520, "y": 80 },
    { "x": 520, "y": 400 },
    { "x": 120, "y": 400 }
  ],
  "epis_obrigatorios": [1, 2],
  "epis_certo_labels": ["CAPACETE - PRESENTE", "COLETE - PRESENTE"],
  "updated_at": "2026-08-15T14:10:00.000Z"
}
```

Se o backend retornar 404 (nenhuma zona configurada para essa câmera), o orquestrador tenta carregar de um arquivo local via `config_server.load_config()`. Se também não tiver, a verificação de zona fica desativada.

---

## 2. Orquestrador grava no Backend

### `POST /api/detections`

Enviado **apenas quando um alerta é confirmado** — ou seja, depois que o debouncer acumula frames suficientes consecutivos com risco (10 frames para EPI, 8 para ergonomia, 3 para zona). Não é enviado a cada frame.

O envio vai para uma fila interna (`_post_queue`) consumida por uma thread separada, para não bloquear o loop de inferência enquanto espera o HTTP.

**Body enviado pelo orquestrador:**
```json
{
  "timestamp": "2026-08-19T22:35:10.123456",
  "label": "CAPACETE - AUSENTE, ergonomia_reba_alto_9",
  "confidence": 0.8721,
  "img_Frame": "<JPEG da câmera frontal em base64>",
  "img_Frame_lateral": "<JPEG da câmera lateral em base64>",
  "source": "epi, ergonomia",
  "camera_id": "cam_1"
}
```

> `img_Frame_lateral` só aparece quando há câmera dupla configurada e o frame lateral estava disponível.  
> `label` é a concatenação de todos os `reasons` do veredito confirmado, separados por vírgula.  
> `source` indica quais módulos dispararam: `"epi"`, `"ergonomia"`, `"zona"` ou combinações.

**Resposta esperada do backend:** `201 Created`

---

## 3. Orquestrador transmite ao Frontend (WebSocket `:8765`)

Toda mensagem é um JSON com campo `type` obrigatório. O frontend filtra por `type` para saber o que fazer com cada mensagem.

---

### `type: "frame"`

Frame da câmera **frontal** codificado em JPEG → base64. Enviado a cada iteração do loop.

```json
{
  "type": "frame",
  "data": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQ..."
}
```

O frontend decodifica o base64 e desenha num `<canvas>` ou `<img>`.

---

### `type: "frame_lateral"`

Frame da câmera **lateral** (2ª câmera da mesma unidade). Só enviado quando `CAMERA_SOURCE_LATERAL` está configurado.

```json
{
  "type": "frame_lateral",
  "data": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQ..."
}
```

---

### `type: "detections"`

Lista de todas as bounding boxes detectadas pelo modelo EPI no frame atual, independente de ter virado alerta ou não.

```json
{
  "type": "detections",
  "data": [
    {
      "label": "CAPACETE - PRESENTE",
      "confidence": 0.9231,
      "x1": 210,
      "y1": 45,
      "x2": 310,
      "y2": 130
    },
    {
      "label": "COLETE - AUSENTE",
      "confidence": 0.8104,
      "x1": 180,
      "y1": 130,
      "x2": 360,
      "y2": 320
    }
  ]
}
```

---

### `type: "pose"`

Keypoints e análise REBA de cada pessoa detectada. Enviado a cada 2 frames (não todo frame, para poupar GPU/CPU). Vem em duas mensagens separadas quando câmera dupla está ativa — uma `source: "frontal"` e uma `source: "lateral"` — para que cada canvas desenhe só a detecção real da própria câmera.

```json
{
  "type": "pose",
  "source": "frontal",
  "pessoas": [
    {
      "pessoa_id": 0,
      "confianca_deteccao": 0.87,
      "keypoints": [
        { "x": 320.4, "y": 85.2, "conf": 0.91 },
        { "x": 318.1, "y": 80.0, "conf": 0.88 },
        { "x": 325.0, "y": 80.5, "conf": 0.85 }
      ],
      "reba_score": 6,
      "reba_level": "MÉDIO",
      "angulos": {
        "pescoco": 32.1,
        "tronco": 45.7,
        "joelho_esq": 160.2
      },
      "queda": false
    }
  ]
}
```

> `reba_level` pode ser: `"BAIXO"` (1–3), `"MÉDIO"` (4–7), `"ALTO"` (8–15).  
> `queda: true` quando a razão altura/largura do bounding box da pessoa indica posição horizontal.  
> `keypoints` segue a ordem do YOLOv8-pose (17 pontos COCO): nariz, olho_esq, olho_dir, orelha_esq, orelha_dir, ombro_esq, ombro_dir, cotovelo_esq, cotovelo_dir, pulso_esq, pulso_dir, quadril_esq, quadril_dir, joelho_esq, joelho_dir, tornozelo_esq, tornozelo_dir.

---

### `type: "verdict"`

Veredito consolidado do frame, combinando EPI + ergonomia + zona. Enviado a cada frame. Tem um cooldown de 20 frames — ao sair de risco, o veredito de alerta é mantido por mais 20 frames antes de voltar a `"MONITORANDO"`.

```json
{
  "type": "verdict",
  "status": "ALERTA_MULTIPLO",
  "reasons": [
    "CAPACETE - AUSENTE",
    "ergonomia_reba_médio_6"
  ],
  "confidence": 0.8412,
  "sources": ["epi", "ergonomia"],
  "timestamp": "2026-08-19T22:35:10.987654"
}
```

**Valores possíveis de `status`:**

| Status | Quando |
|---|---|
| `"MONITORANDO"` | Nenhum risco detectado |
| `"ALERTA"` | Um módulo disparou (EPI ou ergonomia ou zona), nível normal |
| `"ALERTA_CRITICO"` | Um módulo disparou com nível alto (REBA ≥ 8 ou invasão de zona) |
| `"ALERTA_MULTIPLO"` | Dois ou mais módulos dispararam ao mesmo tempo |

**Formato de `reasons` por módulo:**
- EPI: label direta do modelo, ex: `"CAPACETE - AUSENTE"`, `"LUVA - AUSENTE"`
- Ergonomia: `"ergonomia_reba_<level>_<score>"`, ex: `"ergonomia_reba_alto_9"`
- Zona: `"zona_perigo"` + `"zona_epi_ausente_<id>"` para cada EPI obrigatório faltando

---

### `type: "alert"`

Enviado por EPI confirmado (depois do debounce de 10 frames), um por label detectado. É mais específico que o `verdict` — só fala de EPI, não de ergonomia/zona.

```json
{
  "type": "alert",
  "label": "LUVA - AUSENTE",
  "confidence": 0.8932,
  "timestamp": "2026-08-19T22:35:12.456789"
}
```

---

### `type: "queda"`

Enviado quando queda é confirmada (6 frames consecutivos com pessoa em posição horizontal). Lista os IDs das pessoas que caíram.

```json
{
  "type": "queda",
  "timestamp": "2026-08-19T22:36:01.123456",
  "pessoas": [0, 2]
}
```

---

### `type: "metrics"`

Métricas de desempenho do pipeline, enviadas a cada frame. Usadas pelo painel de monitoramento do frontend.

```json
{
  "type": "metrics",
  "latencia_total_ms": 142.3,
  "latencia_epi_ms": 0.0,
  "latencia_pose_ms": 38.7,
  "pck_pose": 0.8235,
  "conf_media_epi": 0.8671
}
```

> `latencia_epi_ms` costuma ser `0.0` porque o modelo EPI roda em background a cada 5 frames — o custo não fica visível no loop principal.  
> `pck_pose`: PCK (Percentage of Correct Keypoints) com threshold 0.5 — métrica de qualidade da detecção de pose. `null` quando nenhuma pessoa está em cena.  
> `conf_media_epi`: média de confiança de todas as detecções EPI do frame. `null` quando nenhuma detecção.

---

## Resumo rápido

| Direção | Protocolo | Endpoint / Canal | Quando |
|---|---|---|---|
| Orquestrador ← Backend | HTTP GET | `/api/cameras` | Startup + a cada 15s |
| Orquestrador ← Backend | HTTP GET | `/api/zonas/:camera_id` | Startup (uma vez) |
| Orquestrador → Backend | HTTP POST | `/api/detections` | Só em alerta confirmado (debounced) |
| Orquestrador → Frontend | WebSocket | `ws://localhost:8765` | Streaming contínuo |
| — | — | `type: "frame"` | Todo frame |
| — | — | `type: "frame_lateral"` | Todo frame (câmera dupla) |
| — | — | `type: "detections"` | Todo frame |
| — | — | `type: "pose"` | A cada 2 frames |
| — | — | `type: "verdict"` | Todo frame |
| — | — | `type: "alert"` | Só em EPI confirmado |
| — | — | `type: "queda"` | Só em queda confirmada |
| — | — | `type: "metrics"` | Todo frame |
