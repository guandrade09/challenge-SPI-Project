# Arquitetura do Sistema — SPI Challenge

## Visão Geral

O sistema é composto por múltiplos modelos de visão computacional rodando em paralelo, cada um responsável por um tipo de análise. O objetivo final é combinar os resultados desses modelos em um único **veredicto de aprovação ou rejeição** para uma ação (ex: liberar acesso, emitir alerta, acionar alarme).

```
┌─────────────────────────────────────────────────────────────────┐
│                        CÂMERA DE ENTRADA                        │
│                    (Controle de Acesso)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ frame
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PIPELINE DE INFERÊNCIA                      │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│   │  ml/epi     │  │ml/facial    │  │ ml/zonadeperigo      │  │
│   │(EPI: capac, │  │(identidade  │  │(pessoa em área       │  │
│   │colete,óculos│  │do operador) │  │ restrita)            │  │
│   └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘  │
│          │                │                     │              │
│          └────────────────┼─────────────────────┘              │
│                           ▼                                     │
│                  ┌─────────────────┐                           │
│                  │   AGGREGATOR    │                           │
│                  │  (motor de      │                           │
│                  │   veredicto)    │                           │
│                  └────────┬────────┘                           │
└───────────────────────────┼─────────────────────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │       VEREDICTO         │
              │  APROVADO / REJEITADO / │
              │        ALERTA           │
              └────────────┬────────────┘
                           ▼
            ┌──────────────────────────────┐
            │  Ações: catraca / alarme /   │
            │  notificação / backend API   │
            └──────────────────────────────┘
```

---

## Tipos de Câmera e Modelos Aplicáveis

O sistema suporta dois modos de operação dependendo do contexto da câmera:

### Modo 1: Câmera de Controle de Acesso
**Onde:** Catracas, entradas de área restrita.
**Pergunta:** "Esta pessoa pode entrar?"

| Modelo | Papel | Condição para Aprovação |
|---|---|---|
| `ml/facial` | Identifica quem é a pessoa | Pessoa cadastrada no sistema |
| `ml/epi` | Verifica equipamentos obrigatórios | 100% dos EPIs presentes |

**Lógica:** `facial=OK` **E** `epi=OK` → `APROVADO`. Qualquer falha → `REJEITADO`.

---

### Modo 2: Câmera de Monitoramento Contínuo
**Onde:** Dentro da fábrica, perto de máquinas, esteiras.
**Pergunta:** "Existe algum risco acontecendo agora?"

| Modelo | Papel | Condição para Alerta |
|---|---|---|
| `ml/riscoergonomico` | Detecta posturas perigosas | Postura de risco confirmada por N frames |
| `ml/zonadeperigo` | Detecta invasão de área proibida | Pessoa detectada na zona restrita |
| `ml/epi` | Verifica EPIs durante o trabalho | EPI removido durante a atividade |

**Lógica:** Qualquer modelo positivo → `ALERTA` com nível de severidade.

---

## Arquitetura de Hardware (Edge Computing)

A abordagem recomendada é **um mini-PC por câmera**, rodando os modelos localmente.

```
┌─────────────────────────────────────────────────────────────────┐
│  MINI-PC #1 (entrada principal)                                 │
│  ┌──────────┐    ┌─────────────────────────────────────────┐   │
│  │ Câmera 1 │───▶│ Docker: ml/epi + ml/facial + aggregator │   │
│  └──────────┘    └──────────────────┬──────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────┘
                                      │ JSON de resultado
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  MINI-PC #2 (zona de máquinas)                                  │
│  ┌──────────┐    ┌────────────────────────────────────────────┐ │
│  │ Câmera 2 │───▶│ Docker: ml/epi + ml/riscoergonomico + agg  │ │
│  └──────────┘    └──────────────────┬──────────────────────── ┘ │
└─────────────────────────────────────┼───────────────────────────┘
                                      │ JSON de resultado
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVIDOR CENTRAL (pode ser um notebook comum)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Backend Node.js + SQLite + Frontend React                │   │
│  │ Recebe apenas JSON leve, nunca vídeo                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Por que isso é eficiente:**
- A IA roda no mini-PC, colada à câmera — zero latência de rede para inferência.
- Pela internet trafega apenas o resultado: `{"camera": 1, "veredicto": "rejeitado", "motivo": "sem_capacete"}`.
- Se a internet cair, o mini-PC continua operando e tomando ações locais (alarme, trava).
- Adicionar uma nova câmera = comprar um novo mini-PC.

---

## Stack de Tecnologia por Camada

| Camada | Tecnologia | Motivo |
|---|---|---|
| Captura de câmera | OpenCV (`cv2`) | Leve, compatível com câmeras USB e IP |
| Inferência ML | YOLOv8 + ONNX Runtime | YOLO para detecção, ONNX para velocidade |
| Comunicação interna (mesmo PC) | Filas Python (`queue.Queue`) | Zero overhead, nativo, sem dependências |
| Streaming de vídeo para frontend | WebSocket (`websockets`) | Já implementado, baixa latência |
| Persistência de incidentes | REST HTTP → Backend | Assíncrono (thread separado), não bloqueia o loop |
| Comunicação entre mini-PCs | MQTT (Mosquitto) | Protocolo IoT, leve, funciona em redes instáveis |
| Backend central | Node.js + Express + SQLite | Já implementado no projeto |
| Frontend | React + TypeScript (Vite) | Já implementado no projeto |

---

## Fluxo de Dados Completo (por frame)

```
1. Camera.read() → frame bruto (numpy array)
2. frame → queue de captura (maxsize=2, descarta frames velhos)
3. thread de inferência consome a queue
4. frame → Modelo 1 (inferência)  ┐
   frame → Modelo 2 (inferência)  ├─ paralelo com threading
   frame → Modelo N (inferência)  ┘
5. resultados → Aggregator.decide() → veredicto
6. SE veredicto == alerta/rejeição:
   a. send_alert() via WebSocket (tempo real, frontend)
   b. threading.Thread → POST /api/detections (persistência, não bloqueia)
   c. ação local (beep, trava, LED) em thread separada
7. send_frame() via WebSocket (preview de vídeo para frontend)
```

---

## Próximos Passos Recomendados

1. **Corrigir inferência dupla** em `ml/epi`, `ml/riscoergonomico` e `ml/zonadeperigo` — ver [ISSUES_POR_BRANCH.md](./inference/ISSUES_POR_BRANCH.md)
2. **Implementar o Aggregator** — ver [PIPELINE_UNIFICADO.md](./inference/PIPELINE_UNIFICADO.md)
3. **Converter modelos para ONNX** — ver [PERFORMANCE.md](./inference/PERFORMANCE.md)
4. **Separar captura e inferência em threads distintos** — ver [PERFORMANCE.md](./inference/PERFORMANCE.md)
