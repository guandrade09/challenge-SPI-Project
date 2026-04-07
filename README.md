# 👷‍♂️ Challenge SPI: Monitoramento Preventivo de EPI

O Challenge de 2026 de Engenharia da Computação 3ECR faz parceria com a ** ABDI/SPI - Metaindústria – Agência Brasileira de Desenvolvimento Industrial**, que propoem uma solução de visão computacional voltada para a **Segurança do Trabalho**. O objetivo deste protótipo é automatizar a fiscalização do uso de capacetes em campos com maquinários, reduzindo o risco de acidentes por meio de alertas em tempo real.

## Participantes 👥

* Gabriel Lacerda Covello Arimatéa **RM556391**
* Gustavo Andrade de Sousa **RM559069**
* Lucas Santos Rodrigues **RM556891**
* Mayene Gabrielle Aragão Padilha Doria **RM558858**



## 📌 Visão Geral do Protótipo (Sprint 1)

Este projeto utiliza *Machine Learning* para detectar e gerenciar riscos de segurança em relação a utilização de EPIs.

### 🧠 1. Machine Learning
A inteligência do sistema é baseada em detecção de objetos de alta performance.
* **Modelo:** Fine-tuning do **YOLOv8**.
* **Classes de Detecção:**
    * `Com Capacete`: Em conformidade (Bounding Box Verde).
    * `Sem Capacete`: Identificação de risco (Bounding Box Vermelha).
* **Lógica de Inferência:** O modelo analisa o frame, extrai as coordenadas e calcula a probabilidade $P(class | object)$. Somente detecções acima de **80% de confiança**.

### 🖥️ 2. Interface e Feedback ao vivo
Uma interface centralizada para o operador de segurança monitorar múltiplas áreas.
* **Tecnologia:** Tela desenvolvida em **HTML** e **CSS**.
* **Feedback ao Vivo:** Renderização do vídeo da câmera com as marcações de *label* sobrepostas.
* **Sistema de Alerta:** Banner visual de alerta que aparece na interface e a borda do player de vídeo muda de cor para sinalizar a urgência.

### 📊 3. Gestão de Logs e Incidentes
Todo incidente é documentado automaticamente para fins de auditoria e treinamento.
* **Armazenamento de Dados:** Utilização de **SQLite** para persistência de texto.
* **Captura de Evidências:**
    * **Imagens:** O sistema salva um arquivo `.jpg` do frame do incidente em uma pasta local separada.
    * **Banco de Dados:** O log armazena o *Timestamp*, o *ID da Câmera* e o *Caminho do Arquivo* (Path) da imagem correspondente.
* **Controle de Duplicidade:** Implementação de um timer de resfriamento (*cooldown*) para não gerar múltiplos logs de um mesmo trabalhador parado no mesmo local.



## 🛠️ Tecnologias Utilizadas

| Componente | Ferramenta |
| :--- | :--- |
| **Linguagem** | Python 3.10+ |
| **Visão Computacional** | OpenCV & YOLOv8 |
| **Interface Gráfica** | HTML e CSS |
| **Banco de Dados** | SQLite |



## 📋 Visão Estratégica

Para melhor visualização do processo da tarefa e andamento do projeto. Para isso, utilizamos o **Miro**:

https://miro.com/welcomeonboard/T0dNNEQ4dVgvaW9XKzZWeVBhb0wwWk5RS0tJNTdLRFF5QnVtOU5JcWczcEt1NnEvV2VrRzhRUkdwbzQySU1SL1IxaUxFYWxFT2dEanhRTGpLTVAwRlFWNVg0WjlDWWdTSUllTGRnOVRLa3h0SVdZb3NaZmo0V0p3a0xTTGNJRDJzVXVvMm53MW9OWFg5bkJoVXZxdFhRPT0hdjE=?share_link_id=396410680465



## ⚙️ Instalação e Execução (Desenvolvimento)

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/safety-vision.git](https://github.com/seu-usuario/safety-vision.git)
