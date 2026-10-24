# 👷 Challenge FIAP: SPI Metaindústria — Monitoramento Preventivo de EPI com IA

> **Challenge 2026 | FIAP × ABDI/SPI — Metaindústria**  
> Engenharia da Computação — Turma 3ECR

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

## 🏭 Contexto do Challenge

O **Challenge 2026** propõe, em parceria com a **ABDI/SPI — Agência Brasileira de Desenvolvimento Industrial**, o desenvolvimento de soluções tecnológicas para o programa **Metaindústria**, iniciativa que visa a transformação digital da indústria brasileira com foco em segurança, produtividade e inovação.

O problema central abordado é a **segurança do trabalho em ambientes industriais**, onde o modelo tradicional de fiscalização — baseado em inspeções periódicas e penalidades reativas — não é suficiente para prevenir acidentes. A proposta do Challenge é a transição para um **modelo proativo**, sustentado por monitoramento contínuo com **visão computacional**, alertas em tempo real e uma cultura de prevenção antes da infração.

---

## 🚨 Problema Abordado

Ambientes industriais — especialmente chão de fábrica com maquinários pesados — apresentam risco elevado de acidentes relacionados à ausência ou uso incorreto de **Equipamentos de Proteção Individual (EPIs)**. Os modelos de fiscalização manuais têm limitações críticas:

- **Cobertura parcial**: inspetores humanos não conseguem monitorar múltiplas zonas simultaneamente.
- **Reatividade**: a penalidade ocorre após o incidente ou após o flagrante, não antes.
- **Subjetividade**: a consistência da fiscalização depende do inspetor presente.
- **Falta de rastreabilidade**: ausência de histórico sistematizado de conformidade por área, turno e trabalhador.

Esses fatores geram riscos à integridade física dos trabalhadores, passivos jurídicos para a empresa e desalinhamento com normas regulamentadoras como a **NR-6** e **NR-12**.

---

## 💡 Proposta de Solução

O projeto consiste em um sistema de visão computacional em campo integrado à lógica de segurança proativa do Metaindústria. A solução combina:

1. **Visão Computacional com YOLOv8**: detecção em tempo real do uso de EPI em zonas de perigo (worksite) e riscos ergonômicos, diretamente no feed de câmeras industriais já instaladas.
2. **Sistema de Alertas em Tempo Real**: notificação imediata quando uma infração é detectada, com identificação da câmera e classificação.
3. **Gestão de Logs e Evidências**: armazenamento automático de incidentes com timestamp, câmera de origem e captura do frame do ocorrido para auditoria.
4. **Dashboard de Monitoramento**: interface centralizada para o supervisor acompanhar múltiplas câmeras, consultar histórico de incidentes e extrair relatórios de conformidade.

A solução **não substitui o supervisor humano**, mas amplifica sua capacidade de resposta, eliminando pontos cegos de monitoramento e fornecendo dados estruturados para tomada de decisão gerencial. 

### Escopo da Aplicação

| Ator | Papel na Solução |
|---|---|
| **Câmera Industrial** | Dispositivo de monitoramento; captura frames para verificação |
| **Operador de Chão de Fábrica** | Usuário monitorado; recebe orientação visual/sonora em campo |
| **Supervisor de Segurança** | Consulta o relatório de logs e dashboard e valida incidentes |
| **Gestor Industrial** | Acessa relatórios gerenciais de conformidade e histórico de KPIs |

**Funcionalidades cobertas na Sprint 1 (MVP):**
- Detecção de EPIs via câmera (capacete, máscara, colete)
- Emissão de alerta visual na interface do supervisor
- Registro automático de incidentes em banco de dados local
- Captura de imagem-evidência do frame do incidente

**Restrições técnicas:**
- Funciona com câmeras IP ou USB já existentes (sem hardware adicional obrigatório)
- Processamento local (edge computing), sem dependência de nuvem para inferência
- Banco de dados local embarcado (SQLite) para o MVP; escalável para PostgreSQL em sprints futuras

---

## 🛠️ Tecnologias Selecionadas e Justificativa Técnica

| Componente | Ferramenta | Justificativa |
|---|---|---|
| **Linguagem** | Python 3.10+ | Ecossistema consolidado para ML/CV, suporte nativo às bibliotecas de detecção, alta produtividade para prototipação industrial |
| **Visão Computacional** | OpenCV | Biblioteca padrão da indústria para captura e processamento de frames de câmeras em tempo real; baixa latência |
| **Modelo de Detecção** | YOLOv11 (Ultralytics) | Detecção de objetos em tempo real; fine-tuning com datasets customizados; inferência eficiente em CPU/GPU |
| **Plataforma de Treinamento** | Roboflow | Classificação dos objetos por *labeling* e desenvolvimento do dataset envolvendo treinamento, validação e testes |  
| **Interface Gráfica** | React | Website para o interface das funcionalidades; adequado para exibição em monitores de controle industrial |
| **Backend** | API REST em Express | SQLite para prototipação sem infraestrutura; PostgreSQL para escalabilidade multi-câmera e multi-turno em produção |
| **Banco de Dados** | SQLite (MVP) | SQLite para prototipação sem infraestrutura |
| **Armazenamento de Evidências** | Sistema de arquivos local (`.jpg`) | Captura de frames de baixo custo computacional; caminhos armazenados no BD para consulta rápida |

**Decisão de arquitetura:** o sistema é desenhado como **monolito modular** no MVP, com separação clara entre os módulos de inferência, alertas e persistência — facilitando a futura migração para arquitetura de microsserviços conforme escala da solução.

---

## 📏 Normas e Conformidade

A solução foi projetada com base nas seguintes normas regulamentadoras brasileiras:

- **NR-6** — Equipamentos de Proteção Individual
- **NR-12** — Segurança no Trabalho em Máquinas e Equipamentos
- **LGPD** — imagens dos trabalhadores são tratadas como dados sensíveis; o sistema armazena apenas frames de incidentes, não grava vídeo contínuo

---

## 🔌 Hardware de Alerta (Sinaleiro ESP32 + Tomada Zigbee)

Além do alerta na tela, o sistema aciona um **sinaleiro físico** e pode **cortar a energia** de uma máquina:

| Estado | Quando acende | Buzzer | Tomada |
|---|---|---|---|
| 🔴 Vermelho | Queda **ou** invasão de zona de risco | Soa | **Desliga** |
| 🟠 Laranja | EPI ausente | Soa | **Desliga** |
| 🟡 Amarelo | Neutro (firmware do ESP32) | Não soa | Não altera |
| 🟢 Verde | Tudo limpo por 15 frames seguidos | Não soa | **Liga** |

- **Componentes:** ESP32 com LEDs vermelho/laranja/amarelo/verde + buzzer (controlado por HTTP) e tomada Zigbee.
- **Como a tomada é controlada:** tudo local, sem nuvem — substituiu a tomada Tuya Wi-Fi (`tinytuya`), que tinha latência alta. Firmwares e instruções em [`firmware/`](firmware/).
  - **Só a tomada, pelo cabo USB (montagem atual):** o PC fala com um ESP32-C6 pela USB (`ESP_SERIAL`), e o C6 liga/desliga a tomada via Zigbee (`tomada_usb_c6`). Sem Wi-Fi e sem LEDs.
  - **Sinaleiro pelo Wi-Fi:** o orquestrador fala com o ESP32 do sinaleiro por HTTP (`ESP_IP`), que avisa um ESP32-C6 via ESP-NOW (`esp32_alert_v4` + `TomadaZigbee`).
- **Várias câmeras, um só sinaleiro:** basta uma câmera em risco para alertar; o verde só acende quando todas as câmeras com pessoas estão limpas.
- **Webcam do notebook:** na tela de câmeras, a opção "Usar webcam do notebook" cadastra a webcam local (índice `0`, `1`, ...) como câmera.
- **Código:** [`orquestrador/hardware_alert.py`](orquestrador/hardware_alert.py) · teste manual do ESP32: [`orquestrador/test_esp32_led.py`](orquestrador/test_esp32_led.py)

### Configuração rápida

```powershell
pip install -r requirements.txt

cd orquestrador

# Só a tomada, pelo cabo USB (feche o Monitor Serial da Arduino IDE antes):
$env:ESP_SERIAL = "COM5"                       # porta do ESP32-C6 no Gerenciador de Dispositivos

# OU sinaleiro pelo Wi-Fi:
$env:ESP_IP = "<ip do ESP32 nesse wifi>"
python test_esp32_led.py                       # opcional: testa LEDs, buzzer e tomada

python main.py
```

Regra da tomada: EPI ausente, invasão da área de risco ou queda **desligam**; ela só **liga** de novo depois de 15 frames seguidos com todos fora da área e com EPI.

Sem o ESP32-C6 ligado, o orquestrador e o sinaleiro funcionam normalmente, só sem cortar a tomada. Detalhes em [docs/atualizacoes-hardware-webcam.md](docs/atualizacoes-hardware-webcam.md).

---

## 📄 Documentação Técnica

- [🎭 Diagrama de Casos de Uso](docs/UML.md)
- [🔄 Diagrama de Atividades](docs/atividades.md)
- [📋 Levantamento de Requisitos](docs/REQUISITOS.md)
- [🧩 Diagrama de Classes](docs/classes.md)
- [💻 Mapeamento de Telas](docs/mapeamento.md)
- [🔌 Hardware: sinaleiro, tomada e webcam local](docs/atualizacoes-hardware-webcam.md)

---

## Figma do Projeto

- [🎨 Roteiro de Telas](https://www.figma.com/proto/uGj3qxy9ClUpzskzSfyO2s/Roteiro-de-Telas?node-id=0-1&t=aR0EgGS9eaSZBB8Z-1)

### Como 

## ⚙️ Como Executar (Sprint 1 — MVP)

```bash
# Clone o repositório
git clone https://github.com/<org>/safevision.git
cd safevision

# Instale as dependências
pip install -r requirements.txt

# Execute o sistema de monitoramento
python src/main.py --camera 0 --confianca 0.8
```

---
