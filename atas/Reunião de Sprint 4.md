# Reunião da Quarta Entrega - Review Final - Challenge Codexis

Data: 23/09/2026 
Modalidade: Presencial 
Participantes: Equipe Codexis
Pauta: Revisão do quarto ciclo de desenvolvimento e validação da quarta entrega do projeto (Mentoria 4 – Documentação consolidada)

## 1. Abertura

Ciclo marcado pela consolidação da documentação das três mentorias anteriores em um único relatório, organizado por frente técnica (Machine Learning, Frontend e Backend), e pela definição das quatro frentes de evolução desta etapa: ampliação do dataset de detecção de EPI, melhoria da latência do streaming da câmera, telas de auditoria e inventário de incidentes e notificação visual e sonora com componentes físicos (ESP32). O sistema é referido como Codexis (nome do grupo e do projeto) e SafeVision (nome do sistema no relatório técnico da Fase 2); ambos designam a mesma solução.

## 2. Itens discutidos por frente

### Machine Learning

Ampliação do Dataset — documentado. Dataset final de EPI com 1800 imagens, divididas em treino (60%, 1080 imagens), validação (25%, 450) e teste (15%, 270). Classes finais: capacete, óculos, colete, máscara, bota e protetor auricular, cada uma com variantes de presença e ausência. Divisão feita por cena ou vídeo, e não por quadro, para evitar vazamento entre os conjuntos; data augmentation aplicado somente ao treino; versões registradas no Roboflow e referenciadas no GitHub.
Otimização da latência do streaming — planejado. Ações previstas: instrumentação por etapa, captura em thread dedicada com buffer mínimo, redução de resolução e compressão JPEG ajustável, inferência espaçada a cada N frames, exportação do modelo (por exemplo, ONNX) e manutenção do WebSocket como transporte. Meta de referência: latência ponta a ponta de até 200 ms; medição ainda não executada.
Métricas de pose e ergonomia — pendente. PCK, acurácia de classificação postural, recall em postura de risco imediato e falsos alarmes por hora seguem como "A PREENCHER", pois a branch ainda não contém script de avaliação quantitativa nem dataset próprio anotado.

### Interface

Telas de auditoria e inventário de incidentes — proposto. Inventário paginado com filtros por período, zona, tipo, severidade e status; detalhe do incidente com frame de evidência e linha do tempo; fluxo de tratamento (Aberto → Em análise → Resolvido) com registro de quem alterou, quando e justificativa; indicadores para RH/CIPA; exportação de relatório em PDF/CSV.
Notificação visual e sonora na tela — mantido. O frontend continua responsável pelo alerta visual e sonoro ao operador, usando a mesma escala de severidade do dispositivo físico.
Decisões de UX documentadas — concluído. Canais de comunicação, escala de severidade (Baixa, Média, Alta, Crítica), linguagem padronizada dos estados (ONLINE, OFFLINE, SEM SINAL, PRONTO, AGUARDANDO) e stack do frontend (React 19, Vite, TailwindCSS v4, Zustand, Recharts, Axios).

### API Central

Inventário de incidentes e trilha de auditoria — proposto. Incidente como entidade própria, com tabela de incidentes e tabela de histórico de auditoria apenas com inserção (sem edição ou exclusão); endpoints de listagem com filtros e paginação, detalhe, atualização de status e exportação; acesso às evidências restrito a perfis autorizados, conforme as diretrizes de LGPD.
Integração com ML e orquestrador — concluído. Resultado por frame transmitido via WebSocket e incidentes confirmados registrados via API REST, com debounce por tipo de risco (EPI 10 frames, ergonomia 8, zona 3, queda 6).

### Hardware (Notificação)

Notificação sonora e visual por ESP32 — proposto. Dispositivo instalado próximo ao posto monitorado, na mesma rede local do servidor, acionado após a confirmação do incidente (HTTP, MQTT ou WebSocket), com LED e buzzer proporcionais à severidade. Mapeamento de severidade ainda a validar em testes; heartbeat com exibição de SEM SINAL no dashboard; opção de silenciar o som mantendo o sinal luminoso; firmware (C++ com Arduino ou MicroPython) a definir pelo grupo. O dispositivo apenas sinaliza e não se integra a esteiras, catracas ou PLCs.

## 3. Decisões tomadas

Consolidação das Mentorias 1 a 3 em um único relatório por frente técnica, com as quatro frentes novas da Mentoria 4 incluídas no escopo.
Divisão do dataset por cena ou vídeo, com data augmentation restrito ao conjunto de treino.
Manutenção do WebSocket como transporte de tempo real, evitando polling HTTP.
Mesma escala de severidade para tela e dispositivo físico; ESP32 limitado à sinalização, sem integração com o processo produtivo.
Trilha de auditoria somente com inserção, para que o histórico não possa ser apagado pelo usuário comum.

## 4. Pendências e próximos passos

Medir e reportar PCK, acurácia, recall, falsos alarmes por hora e latência ponta a ponta (meta de 200 ms) sobre vídeos próprios anotados, em no mínimo três cenários distintos, com termo de consentimento.
Implementar a instrumentação de latência por etapa e as otimizações previstas no streaming.
Implementar as telas de inventário e auditoria de incidentes e os endpoints e tabelas correspondentes.
Concluir o firmware e os testes do módulo ESP32, validando o mapeamento de severidade e medindo o tempo entre a confirmação do incidente e o acionamento.
Realizar testes de usabilidade com usuários representativos (equipes de RH/CIPA) e refinar o painel de alertas com múltiplas não conformidades simultâneas.
Executar testes de carga e de performance do backend e reportar tempo de resposta, disponibilidade e taxa de erro.
Documentar o uso de IA generativa, caso aplicável, indicando arquivos/funções e finalidade.
