# Documentação de Arquitetura e Inferência

Esta pasta contém a documentação técnica sobre a arquitetura do sistema e as decisões de engenharia relacionadas à inferência dos modelos de visão computacional.

## Índice

### Arquitetura Geral
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Visão geral do sistema, tipos de câmera, fluxo de dados e stack de tecnologia

### Inferência e Performance
- [inference/PIPELINE_UNIFICADO.md](./inference/PIPELINE_UNIFICADO.md) — Como combinar todos os modelos em um único veredicto (Aggregator)
- [inference/PERFORMANCE.md](./inference/PERFORMANCE.md) — Guia de otimização: ONNX, threads, benchmarks e checklist
- [inference/ISSUES_POR_BRANCH.md](./inference/ISSUES_POR_BRANCH.md) — Bugs e más práticas identificados em cada branch de ML
- [inference/COMUNICACAO.md](./inference/COMUNICACAO.md) — Migração de REST para MQTT: quando usar cada protocolo e como implementar

## Leitura Recomendada

Se você está começando, leia nesta ordem:
1. `ARCHITECTURE.md` — entenda o sistema como um todo
2. `inference/ISSUES_POR_BRANCH.md` — veja os problemas no código atual
3. `inference/PERFORMANCE.md` — entenda como resolver esses problemas
4. `inference/COMUNICACAO.md` — entenda como os serviços devem se comunicar
5. `inference/PIPELINE_UNIFICADO.md` — entenda como integrar todos os modelos em um veredicto único
