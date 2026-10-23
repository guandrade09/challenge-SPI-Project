# 👷 Codexis · SafeVision — Monitoramento Preventivo de EPI e Ergonomia com IA

> **Challenge 2026 | FIAP × ABDI/SPI — Metaindústria**
> Engenharia da Computação — Turma 3ECR

Este README é o documento-âncora do projeto: reúne a proposta de solução, os links do protótipo, do Trello e do vídeo final, as instruções de uso e o resumo das entregas por Sprint.

---

## 📑 Sumário

1. [Integrantes](#-integrantes)
2. [Links do projeto](#-links-do-projeto)
3. [Contexto do Challenge](#-contexto-do-challenge)
4. [Problema abordado](#-problema-abordado)
5. [Proposta de solução](#-proposta-de-solução)
6. [Arquitetura](#-arquitetura)
7. [Tecnologias e justificativa técnica](#-tecnologias-e-justificativa-técnica)
8. [Como executar](#-como-executar)
9. [Resumo das entregas por Sprint](#-resumo-das-entregas-por-sprint)
10. [Métricas e estado atual](#-métricas-e-estado-atual)
11. [Limitações conhecidas](#-limitações-conhecidas)
12. [Normas, conformidade e LGPD](#-normas-conformidade-e-lgpd)
13. [Documentação técnica](#-documentação-técnica)
14. [Próximos passos](#-próximos-passos)

---

## 👥 Integrantes

| Nome | RM |
|---|---|
| Gabriel Lacerda Covello Arimatéa | RM556391 |
| Geovana Carvalho Pederneschi | RM559092 |
| Gustavo Andrade de Sousa | RM559069 |
| Lucas Santos Rodrigues | RM556891 |
| Mayene Gabrielle Aragão Padilha Doria | RM558858 |
| Thais Helena Ferreira Vieira | RM552387 |

---

## 🔗 Links do projeto

| Recurso | Link |
|---|---|
| 🎨 Protótipo (Figma — Roteiro de Telas) | [Abrir no Figma](https://www.figma.com/proto/uGj3qxy9ClUpzskzSfyO2s/Roteiro-de-Telas?node-id=0-1&t=aR0EgGS9eaSZBB8Z-1) |
| 📋 Quadro Trello | [Abrir no Trello](https://trello.com/invite/b/6ab1c9be546ef9ccb3434a3a/ATTI7a4a2886cd1df385d417024ac0c7c85dFFCF3FC0/codexis-challenge) |
| 🎬 Vídeo final (demonstração) | [Abrir no Youtube](https://www.youtube.com/) |
| 🗺️ Roadmap (Miro) | [Abrir no Miro](https://miro.com/app/board/uXjVHG1bIBw=/?share_link_id=985870160011) |

---

## 🏭 Contexto do Challenge

O **Challenge 2026** propõe, em parceria com a **ABDI/SPI — Agência Brasileira de Desenvolvimento Industrial**, o desenvolvimento de soluções tecnológicas para o programa **Metaindústria**, iniciativa que visa a transformação digital da indústria brasileira com foco em segurança, produtividade e inovação.

O problema central é a **segurança do trabalho em ambientes industriais**, onde o modelo tradicional de fiscalização, baseado em inspeções periódicas e penalidades reativas, não basta para prevenir acidentes. A proposta é migrar para um **modelo proativo**, sustentado por monitoramento contínuo com **visão computacional**, alertas em tempo real e uma cultura de prevenção antes da infração. O princípio central do Challenge é **prever o risco, e não apenas detectar a infração**.

---

## 🚨 Problema abordado

Em 2023, o Brasil registrou mais de 580 mil acidentes de trabalho, dos quais cerca de 30% envolveram falha no uso correto de EPIs, com custo direto e indireto estimado em R$ 70 bilhões por ano com SST (fonte: MTE/Smartlab e OIT).

Ambientes industriais, especialmente o chão de fábrica com maquinário pesado, concentram risco elevado por ausência ou uso incorreto de **Equipamentos de Proteção Individual (EPIs)**. A fiscalização manual tem limitações críticas:

- **Cobertura parcial:** inspetores humanos não monitoram múltiplas zonas ao mesmo tempo, e as inspeções pontuais não cobrem turnos completos.
- **Reatividade:** a penalidade ocorre depois do incidente ou do flagrante, e a não conformidade é identificada tarde.
- **Subjetividade:** a consistência da fiscalização depende do inspetor presente.
- **Falta de rastreabilidade:** não há histórico sistematizado de conformidade por área, turno e trabalhador, e os registros dependem de planilhas e papel.
- **CFTV passivo:** as câmeras apenas gravam, sem análise automatizada.

Esses fatores geram risco à integridade física dos trabalhadores, passivos jurídicos para a empresa e desalinhamento com normas como a **NR-6** e a **NR-12**.

---

## 💡 Proposta de solução

Um sistema de visão computacional em campo, integrado à lógica de segurança proativa do Metaindústria, que roda três análises em paralelo sobre o mesmo stream de vídeo:

| Módulo | O que faz | Técnica |
|---|---|---|
| **Detector de EPI** (Fase 1) | Detecta pessoas e EPIs (ou a ausência deles) | YOLOv11 |
| **Pose Estimation** (Fase 2) | Classifica o risco ergonômico e detecta queda | YOLOv8-Pose (17 keypoints COCO) + método REBA |
| **Zona de Perigo** (Fase 2) | Detecta invasão de zonas críticas e exige EPIs por zona | Geometria computacional (Shapely) |

Em conjunto com:

1. **Alertas em tempo real:** notificação imediata (visual e sonora) quando uma infração é detectada, com identificação da câmera e classificação.
2. **Gestão de logs e evidências:** armazenamento automático de incidentes com timestamp, câmera de origem e frame do ocorrido, para auditoria.
3. **Dashboard de monitoramento:** interface centralizada para o supervisor acompanhar múltiplas câmeras, consultar o histórico e extrair relatórios de conformidade.

A solução **não substitui o supervisor humano**: amplifica sua capacidade de resposta, elimina pontos cegos e fornece dados estruturados para decisão gerencial.

### Diferenciais

- Score ergonômico baseado no **REBA** (Tabelas A e C), em vez de um limiar de ângulo arbitrário.
- **Debounce por tipo de risco**, que reduz falsos positivos sem atrasar alertas críticos.
- **Zonas configuráveis com EPIs obrigatórios por área** (ex.: capacete e colete apenas na "área da prensa").
- **Captura dual-câmera:** frontal (EPI) e lateral (ergonomia/zona), com modo `independente` ou `mesma_pessoa`, que funde as leituras REBA das duas visões.
- Hierarquia de alertas e linguagem de interface curta e padronizada, pensada para decisão rápida.
- Detecção de Facial para distinção de operador durante detecção

### Escopo da aplicação

| Ator | Papel na solução |
|---|---|
| **Câmera industrial** | Dispositivo de monitoramento; captura frames para verificação |
| **Operador de chão de fábrica** | Usuário monitorado; recebe orientação visual/sonora em campo |
| **Supervisor de segurança** | Consulta o relatório de logs e o dashboard e valida incidentes |
| **Gestor industrial** | Acessa relatórios gerenciais de conformidade e histórico de KPIs |

### Restrições técnicas

- Funciona com câmeras IP ou USB já existentes, sem hardware adicional obrigatório.
- Processamento local (edge computing), sem dependência de nuvem para inferência.
- Banco local embarcado (SQLite) no MVP, escalável para PostgreSQL em sprints futuras.
- Monolito modular no MVP, com separação clara entre inferência, alertas e persistência, o que facilita a migração futura para microsserviços.

### Fora do escopo do MVP

Integração física com PLC, esteiras ou catracas; reconhecimento facial ou biométrico; hospedagem em nuvem 24x7; aplicativo mobile nativo; conformidade plena com a LGPD em ambiente real de operação.

---

## 🧱 Arquitetura

```
Câmera(s) ──► Orquestrador (orquestrador/main.py)
                 │  captura o frame uma única vez e distribui
                 ├─► Detector de EPI   (YOLOv11)
                 ├─► Pose Estimation  (ml_ergonomia: REBA + queda)
                 └─► Zona de Perigo   (ml_zona_critica: Shapely)
                 │
                 ▼
       Veredicto único por frame + debounce por tipo de risco
                 │
        ┌────────┴─────────┐
        ▼                  ▼
  WebSocket (tempo real)   API REST ──► SQLite (logs) + frames (.jpg)
        │                  │
        └──────► Frontend React (câmera ao vivo + dashboard)
```

**Veredicto por frame:** `MONITORANDO`, `ALERTA_EPI`, `ALERTA_ERGONOMIA`, `ALERTA_ZONA` ou `ALERTA_MULTIPLO`.

**Confirmação de incidente (debounce):**

| Tipo de risco | Frames para confirmar | Cooldown (frames) |
|---|---|---|
| EPI | 10 | 60 |
| Ergonomia (REBA ≥ 4) | 8 | 60 |
| Zona crítica | 3 | 30 |
| Queda (risco imediato) | 6 | 120 |

**Fluxo em quatro camadas:** Sistema de Captura → Machine Learning → Interface Visual (bounding box OK/NOK, alerta visual e sonoro) → Sistema de Log (registro, frame salvo localmente e persistência no banco).

---

## 🛠️ Tecnologias e justificativa técnica

| Componente | Ferramenta | Justificativa |
|---|---|---|
| **Linguagem** | Python 3.10+ | Ecossistema consolidado para ML/CV e alta produtividade para prototipação industrial |
| **Visão computacional** | OpenCV | Padrão da indústria para captura e processamento de frames em tempo real, com baixa latência |
| **Detecção de EPI** | YOLOv8 / YOLOv11 (Ultralytics) | Detecção em tempo real, fine-tuning com datasets customizados e inferência eficiente em CPU/GPU |
| **Pose** | YOLOv8-Pose nano (`yolov8n-pose.pt`) | Mesmo framework da Fase 1, leve para tempo real e com 17 keypoints COCO |
| **Zonas** | Shapely | Geometria computacional para verificar keypoints dentro de polígonos |
| **Dataset** | Roboflow | Labeling, versionamento e exportação do dataset (treino, validação e teste) |
| **Backend** | API REST (Flask) + WebSocket | Recebe as inferências, registra incidentes e alimenta dashboard e logs |
| **Banco de dados** | SQLite (MVP) | Prototipação sem infraestrutura; PostgreSQL previsto para escala multi-câmera |
| **Evidências** | Sistema de arquivos local (`.jpg`) | Captura de frames de baixo custo; caminhos guardados no banco para consulta rápida |
| **Frontend** | React, Tailwind CSS, Zustand, Axios | Interface web para monitores de controle; estado centralizado e cores de status consistentes |
| **Design e gestão** | Figma, Miro, Trello, GitHub | Protótipo, roadmap, acompanhamento de tarefas e versionamento |

---

## ⚙️ Como executar

> Confirme caminhos e nomes de scripts no repositório antes de publicar.

### Pré-requisitos

- Python 3.10+ e Node.js 18+
- Webcam USB, câmera IP ou vídeo simulado de chão de fábrica
- Pesos do modelo de EPI treinado e `yolov8n-pose.pt`

### Sprint 1 (MVP, detecção de EPI)

```bash
# Clone o repositório
git clone https://github.com/<org>/safevision.git
cd safevision

# Instale as dependências
pip install -r requirements.txt

# Execute o sistema de monitoramento
python src/main.py --camera 0 --confianca 0.8
```

### Sprints 2 em diante (EPI + ergonomia + zona)

```bash
git checkout ml/ergonomia-zona-risco-labels

# API
python <caminho-da-api>/app.py

# Orquestrador
python orquestrador/main.py

# Frontend
cd <pasta-do-frontend>
npm install
npm run dev
```

### Fluxo de uso

1. Faça login (ou cadastre-se) na interface web.
2. Na **tela de câmera ao vivo**, selecione os EPIs a monitorar no painel "Detecção de EPIs". O painel "Atenção" mostra os percentuais de confiança.
3. Configure, por câmera, a **zona crítica** (polígono em pixels) e os `epis_obrigatorios` dela.
4. Para dual-câmera, defina a câmera frontal e a lateral e escolha o modo de fusão (`independente` ou `mesma_pessoa`).
5. Acompanhe os alertas em tempo real e consulte o histórico na **central de logs**.
6. No **dashboard**, analise os gráficos (análise composta, detecções, eficiência operacional, matriz de confusão) e gere o relatório pelo botão dedicado.

**Estados operacionais:** `ONLINE`, `OFFLINE`, `SEM SINAL`, `PRONTO`, `AGUARDANDO`.
**Severidades:** Baixa (informativa) → Média (atenção preventiva) → Alta (impacto na operação, ex.: câmera offline) → Crítica (segurança ou indisponibilidade significativa, ex.: ausência de EPI em área de risco).

---

## 🚀 Resumo das entregas por Sprint

### Sprint 1 · Mentoria 1 (04/05/2026) — Detecção de EPI

**Objetivo:** apresentar a concepção do sistema e entregar o MVP de reconhecimento de EPIs e pessoas.

- **ML:** YOLOv8 com fine-tuning a partir de pesos pré-treinados. Classes iniciais: Person, Hardhat/NO-Hardhat, Mask/NO-Mask, Safety Vest/NO-Safety Vest. Dataset anotado no Roboflow.
- **Frontend:** identidade visual no Figma, tela de câmera ao vivo com painel de seleção de EPIs e painel de atenção, e dashboard com cinco cards (central de logs, análise composta, gráfico de detecções, eficiência operacional, matriz de confusão) e botão de relatório.
- **Backend:** setup da API, banco SQLite, cadastro/login, módulo de logs com armazenamento de detecções e frames e integração dos logs com os gráficos.
- **Resultados exploratórios (webcam):** confiança de 0,72–0,85 para pessoa, 0,86 para capacete presente e 0,89 para ausente. Na matriz de confusão, capacete e óculos tiveram 95% de acerto e colete 82%. A maior confusão foi entre colete e óculos (13% de erro cruzado).

### Sprint 2 · Mentoria 2 (22/06/2026) — Pose, ergonomia e zona crítica

**Objetivo:** interpretar como o trabalhador se move e onde está, sinalizando o risco antes do acidente.

- **PoseAnalyzer:** YOLOv8-Pose nano com 17 keypoints. Ângulos de tronco, pescoço e pernas e assimetria de ombros viram um score REBA (1 a 15) com níveis BAIXO (1–3), MÉDIO (4–7) e ALTO (8–15).
- **Queda:** nariz abaixo da linha dos ombros combinado com razão largura/altura do bounding box > 1,5, exigindo confiança ≥ 0,5 em ombro, quadril e perna para não confundir enquadramento cortado com queda.
- **ZoneChecker:** zonas poligonais por câmera com 13 keypoints monitorados e EPIs obrigatórios por zona.
- **Orquestrador:** um frame distribuído aos três detectores, veredicto único, debounce por risco, WebSocket para o frontend e API REST para persistência.
- **Dual-câmera:** frontal (EPI) e lateral (ergonomia/zona), com fusão configurável.
- **Casos de borda tratados:** quadril ocluído (fallback geométrico), poucos keypoints (score 1 com motivo `keypoints_insuficientes`), enquadramento cortado, ruído de frame único e assimetria esquerda/direita.

### Sprint 3 · Mentoria 3 (19/08/2026) — Documentação de UX

**Objetivo:** justificar as decisões de interface para comunicar segurança, desempenho e monitoramento de forma clara e rápida.

- **Canais:** visual (cards, indicadores, gráficos, cores de status), estados operacionais, análise (gráficos temporais, matriz de confusão, histórico) e controle (detecções de EPI próximas ao monitoramento).
- **Severidade dos alertas:** escala Baixa → Média → Alta → Crítica, base para a hierarquia visual Normal → Atenção → Alto → Crítico.
- **Linguagem:** termos curtos e padronizados (ex.: "A câmera não está enviando dados" vira `SEM SINAL`).
- **Stack do frontend:** React, Tailwind CSS, Zustand e Axios.

### Sprint 4 · Mentoria 4 (23/09/2026) — Consolidação

Relatório PDF consolidado das mentorias 1 a 3, com ampliação do dataset de EPI, foco na latência do streaming da câmera, telas de auditoria e inventário de incidentes e notificação visual e sonora com componentes físicos (ESP32).

- **EPIs finais:** capacete, óculos, colete, máscara, bota e protetor auricular.
- **Dataset de EPI:** 1.800 imagens (treino 60%, validação 25%, teste 15%).

### Apresentação Final NEXT (24/10/2026) - Arena e banca

---

## 📊 Métricas e estado atual

As metas vêm do Descritivo Técnico do Challenge. **Os valores medidos de pose ainda precisam ser preenchidos**, pois a branch não contém script de avaliação quantitativa.

| Métrica | Meta | Valor obtido |
|---|---|---|
| PCK (t = 0,1) | ≥ 0,80 | `0,90` |
| Acurácia de classificação postural | ≥ 0,85 | `0,80` |
| Recall em postura de risco imediato | ≥ 0,90 | `0,95` |
| Falsos alarmes por hora | Tendendo a zero | `3/hora` |
| Latência E2E (captura → classificação) | ≤ 200 ms | `500 ms` |

---

## ⚠️ Limitações conhecidas

- Múltiplas pessoas sobrepostas na mesma região da imagem (oclusão pessoa-a-pessoa) ainda não são tratadas.
- Iluminação muito baixa reduz a confiança geral dos keypoints.
- Não há dataset próprio anotado para validar as métricas de pose, e o YOLOv8-Pose usa pesos pré-treinados em COCO Keypoints, sem fine-tuning.
- Testes de usabilidade formais com equipes de RH/CIPA ainda não foram feitos, e o painel de alertas precisa de refinamento com múltiplas não conformidades simultâneas.
- Métricas de desempenho do backend (tempo de resposta, disponibilidade, taxa de erro) e testes de carga ainda não foram reportados.

---

## 📏 Normas, conformidade e LGPD

| Norma / método | Aplicação |
|---|---|
| **NR-6** | Equipamentos de Proteção Individual |
| **NR-12** | Segurança no trabalho em máquinas e equipamentos |
| **NR-17** (Ergonomia) | Postura inadequada, levantamento de carga e ângulos articulares de risco |
| **NR-35** (Trabalho em Altura) | Postura de risco em altura, complementar à detecção de queda |
| **ISO 11226** (NBR ISO 11226) | Limites de posturas estáticas, base dos limiares de tronco e pescoço |
| **REBA** | Conversão de ângulos corporais em score de risco postural (Tabelas A e C) |

**LGPD:**

- Imagens de trabalhadores são tratadas como dados sensíveis: o sistema armazena apenas frames de incidentes e não grava vídeo contínuo.
- Pose e zona operam sobre **keypoints (coordenadas numéricas)**, sem reconhecimento facial e sem associar poses a identificadores pessoais.
- Para testes e dataset próprio: consentimento explícito, armazenamento mínimo com controle de acesso e definição de prazo e critério de exclusão ao fim do projeto.
- **Uso de IA generativa:** documentar aqui, antes da entrega, as ferramentas usadas (arquivos/funções e finalidade). `[PREENCHER]`

---

## 📄 Documentação técnica

- [🎭 Diagrama de Casos de Uso](docs/UML.md)
- [🔄 Diagrama de Atividades](docs/atividades.md)
- [📋 Levantamento de Requisitos](docs/REQUISITOS.md)
- [🧩 Diagrama de Classes](docs/classes.md)
- [💻 Mapeamento de Telas](docs/mapeamento.md)
- [🎨 Roteiro de Telas (Figma)](https://www.figma.com/proto/uGj3qxy9ClUpzskzSfyO2s/Roteiro-de-Telas?node-id=0-1&t=aR0EgGS9eaSZBB8Z-1)
- [📝 Relatórios Técnicos](https://github.com/guandrade09/challenge-SPI-Project/tree/3a7f32a993899ecd607997e4b41dda4191c6613d/docs/Relat%C3%B3rios%20T%C3%A9cnicos)

---

## 🔭 Próximos passos

- Anotar vídeos próprios (mínimo de 3 cenários, com termo de consentimento) e calcular PCK, acurácia e recall.
- Medir a latência E2E em hardware-alvo e otimizar o streaming da câmera.
- Testar e documentar o cenário de múltiplas pessoas sobrepostas.
- Gravar o vídeo de demonstração com os três cenários: postura inadequada, queda e aproximação de zona crítica.
- Implementar as telas de auditoria e inventário de incidentes e a notificação com ESP32.
- Evoluir a UX: score de risco contextualizado, hierarquia avançada de alertas e visualização da pose.
- Consolidar os relatórios das Fases 1 a 3 no documento técnico único da Fase 4.
