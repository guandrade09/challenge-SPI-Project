# Pipeline de Inferência Unificado — Aggregator

## O Problema que o Aggregator Resolve

Hoje cada branch de ML opera de forma isolada: cada um roda seu modelo, decide sozinho se é um incidente e envia para o backend. Isso funciona para um único modelo, mas cria dois problemas quando há múltiplos modelos:

**Problema 1 — Decisão fragmentada:** O modelo de EPI diz "sem capacete" e o de zona de perigo diz "pessoa em área restrita" ao mesmo tempo. Quem gera o alerta? Qual tem prioridade? Hoje cada um gera o seu alerta independentemente, criando ruído no backend.

**Problema 2 — Sem veredicto unificado:** Para o caso de controle de acesso (câmera de catraca), a resposta não é "o modelo X detectou Y". A resposta precisa ser `APROVADO` ou `REJEITADO`, combinando o resultado de múltiplos modelos.

O **Aggregator** é o componente que recebe os resultados de todos os modelos rodando no mesmo frame e emite um único veredicto.

---

## Conceito: O Veredicto

O Aggregator produz sempre um objeto com esta estrutura:

```python
@dataclass
class Verdict:
    status: str          # "APROVADO" | "REJEITADO" | "ALERTA" | "MONITORANDO"
    confidence: float    # confiança média das detecções que motivaram o veredicto
    reasons: list[str]   # lista dos riscos que causaram o status
    timestamp: datetime
    frame_id: int        # contador de frames para rastreabilidade
```

---

## Regras de Decisão

### Câmera de Controle de Acesso

```
SE facial_result.pessoa_identificada == False:
    → REJEITADO (motivo: "pessoa não cadastrada")

SE epi_result.tem_risco == True:
    → REJEITADO (motivo: lista dos EPIs faltando)

SE facial_result.ok E epi_result.ok:
    → APROVADO
```

A lógica usa `E` (AND): **todos** os modelos precisam estar OK para aprovar. Qualquer falha rejeita.

### Câmera de Monitoramento Contínuo

```
SE qualquer modelo detectou risco com confiança >= threshold:
    SE debouncer.confirmado == True:
        → ALERTA (motivo: lista dos riscos)
    SENÃO:
        → MONITORANDO (risco em observação, aguardando confirmação)

SE nenhum modelo detectou risco:
    → MONITORANDO (sem anomalias)
```

A lógica usa `OU` (OR): **qualquer** modelo positivo gera alerta.

---

## Arquitetura do Aggregator

```
                    ┌──────────────────────────────────────────┐
                    │              AGGREGATOR                  │
                    │                                          │
frame ──────────────┤                                          │
                    │  ┌──────────────┐                       │
                    │  │  EPIDetector │──▶ list[Detection]    │
                    │  └──────────────┘         │             │
                    │  ┌──────────────┐          │             │
                    │  │ ZonaDetector │──▶ list[Detection]    │
                    │  └──────────────┘          │             │
                    │  ┌──────────────┐          │             │
                    │  │ ErgoDetector │──▶ list[Detection]    │
                    │  └──────────────┘          │             │
                    │                            ▼             │
                    │                   ┌─────────────────┐   │
                    │                   │  decide(results) │   │
                    │                   └────────┬────────┘   │
                    └────────────────────────────┼─────────────┘
                                                 ▼
                                           Verdict object
```

---

## Implementação de Referência

O código abaixo é um **esqueleto de referência** para orientar a implementação. Não é código final — deve ser adaptado conforme os modelos forem integrados.

```python
# core/aggregator.py

from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol
from core.entities import Detection, RiskLabel


@dataclass
class Verdict:
    status: str
    confidence: float
    reasons: list[str]
    timestamp: datetime = field(default_factory=datetime.now)
    frame_id: int = 0


class Detector(Protocol):
    """Interface que todos os detectores devem seguir."""
    def parse(self, results) -> list[Detection]: ...
    def incidents(self, detections: list[Detection]) -> list[Detection]: ...


class Aggregator:
    """
    Combina resultados de múltiplos detectores em um único veredicto.
    
    mode="access_control" → lógica AND (todos devem passar)
    mode="monitoring"     → lógica OR (qualquer risco gera alerta)
    """

    def __init__(self, mode: str = "monitoring"):
        if mode not in ("access_control", "monitoring"):
            raise ValueError(f"mode inválido: {mode}")
        self.mode = mode
        self._frame_count = 0

    def decide(self, results_per_model: dict[str, list[Detection]]) -> Verdict:
        self._frame_count += 1

        all_incidents: list[Detection] = []
        for model_name, detections in results_per_model.items():
            all_incidents.extend(detections)

        reasons = [d.label for d in all_incidents]
        avg_conf = (
            sum(d.confidence for d in all_incidents) / len(all_incidents)
            if all_incidents else 0.0
        )

        if self.mode == "access_control":
            status = "REJEITADO" if all_incidents else "APROVADO"
        else:
            status = "ALERTA" if all_incidents else "MONITORANDO"

        return Verdict(
            status=status,
            confidence=round(avg_conf, 4),
            reasons=reasons,
            frame_id=self._frame_count,
        )
```

---

## Como Integrar no `main.py`

Substituir o loop atual de cada branch por este padrão:

```python
# Exemplo para câmera de monitoramento com EPI + Zona de Perigo
from core.aggregator import Aggregator

aggregator = Aggregator(mode="monitoring")

while camera.is_opened():
    frame = frame_queue.get()   # thread separado de captura

    # Cada modelo roda separado (futuramente em threads paralelos)
    raw_epi   = epi_detector.model(frame, conf=0.5, verbose=False)
    raw_zona  = zona_detector.model(frame, conf=0.5, verbose=False)

    incidents_epi  = epi_detector.parse(raw_epi)
    incidents_zona = zona_detector.parse(raw_zona)

    verdict = aggregator.decide({
        "epi":  epi_detector.incidents(incidents_epi),
        "zona": zona_detector.incidents(incidents_zona),
    })

    if verdict.status in ("ALERTA", "REJEITADO"):
        confirmed = debouncer.update(verdict)
        if confirmed:
            send_alert(verdict)
            _post_queue.put(verdict_to_payload(verdict, frame))

    # Anotação usa o resultado já calculado (sem segunda inferência)
    annotated = raw_epi[0].plot()
    send_frame(annotated)
```

---

## Paralelismo Futuro (Evolução)

Quando os modelos forem mais pesados ou quando o hardware permitir, os detectores podem rodar em paralelo usando `concurrent.futures`:

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=3) as pool:
    f_epi  = pool.submit(epi_detector.model,  frame, ...)
    f_zona = pool.submit(zona_detector.model, frame, ...)
    f_ergo = pool.submit(ergo_detector.model, frame, ...)

raw_epi  = f_epi.result()
raw_zona = f_zona.result()
raw_ergo = f_ergo.result()
```

Isso faz os três modelos rodarem ao mesmo tempo, e o tempo total será igual ao do modelo mais lento (em vez de soma dos três).

**Atenção:** Para paralelismo funcionar bem, cada modelo deve estar carregado em sua própria instância de objeto. Nunca compartilhe uma instância de modelo entre threads.

---

## Payload Final para o Backend

O veredicto deve ser serializado em um formato único, independente de qual modelo o gerou:

```json
{
  "camera_id": 1,
  "timestamp": "2026-05-19T14:32:01.123Z",
  "status": "REJEITADO",
  "confidence": 0.87,
  "reasons": ["sem_capacete", "zona_perigo"],
  "frame_b64": "...",
  "models_used": ["epi", "zonadeperigo"]
}
```

O backend recebe sempre este formato, sem precisar saber qual modelo rodou ou qual branch originou a detecção.
