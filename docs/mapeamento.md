# 🗺️ Mapa de Telas

Documentação das telas da aplicação, descrevendo a função de cada uma e seus principais elementos de interface. O sistema é uma plataforma de monitoramento de **EPIs (Equipamentos de Proteção Individual)** baseada em visão computacional (IA) e IoT (câmeras, sensores e microcontroladores ESP32), com comunicação em tempo real via WebSocket/MQTT.

## Resumo das Telas

| # | Tela | Acesso (ícone na navbar) | Função principal |
|---|------|---------------------------|-------------------|
| 1 | Login | — (tela inicial, fora do app) | Autenticação de acesso ao sistema |
| 2 | Dashboard / Análise | ícone de lista | Central de logs e métricas de desempenho da IA |
| 3 | Câmera ao Vivo | ícone de câmera | Monitoramento em tempo real e seleção de EPIs a detectar |
| 4 | Configurações | ícone de engrenagem | Configurações gerais (em desenvolvimento) |
| 5 | Início + Assistente de IA | ícone de casa | Visão geral do sistema e chat com assistente de IA |
| 6 | Cadastro / Consulta de EPI | ícone de óculos/VR | Gestão do catálogo de EPIs e atribuição por colaborador |

## Navegação Global

A maioria das telas (exceto o Login) compartilha uma barra de navegação superior fixa, com os seguintes elementos:

- **Ícone de óculos/VR** — acessa a tela de Cadastro e Consulta de EPI.
- **Ícone de lista** — acessa o Dashboard de logs e análises.
- **Ícone de casa** — acessa a tela Início.
- **Ícone de câmera** — acessa a Câmera ao Vivo.
- **Ícone de engrenagem** — acessa as Configurações.
- **Ícone de saída (seta)** — encerra a sessão (logout).
- **Botão "DYNAMIC"** — indicador/alternador de modo de operação do sistema (provavelmente alterna entre modo de detecção dinâmico e estático).
- **Ícone verde (maleta/case)** — destaque do espaço de trabalho/projeto ativo.

---

## 1. 🔐 Login — "Bem-vindo"

Tela de entrada do sistema, responsável pela autenticação do usuário antes de liberar o acesso ao painel.

- Título de boas-vindas e subtítulo identificando o projeto/grupo associado à conta.
- Campo de **e-mail** com ícone de envelope e validação visual (borda verde).
- Campo de **senha** com ícone de cadeado e botão de "olho" para mostrar/ocultar o valor digitado.
- Checkbox **"Lembrar-me"** para manter a sessão ativa entre acessos.
- Link **"Esqueceu a senha?"** para fluxo de recuperação de credenciais.
- Botão principal **"Entrar no Sistema"**, que efetiva o login.
- Link **"Criar conta"** para cadastro de novos usuários.
- Protocolo JWT para autenticação de usuário.

## 2. 📊 Dashboard / Análise — "Central de Logs e Métricas"

Painel analítico e de observabilidade do sistema, reunindo o histórico de eventos e indicadores de desempenho do modelo de IA em um único lugar.

- **Central de Logs**: feed cronológico de eventos do sistema, alertas de segurança, erros críticos, confirmações de detecção da IA, problemas de rede, sincronização de relógio (NTP) e atualizações do modelo de machine learning. Conta com um botão **"Gerar Relatório"** para exportar essas informações.
- **Análise Composta**: gráfico de área mostrando a evolução de uma métrica ao longo das 24 horas do dia (00:00 a 23:59), com navegação por setas para alternar entre diferentes gráficos.
- **Gráfico de Detecções**: gráfico circular (gauge) com a prevalência de cada classe detectada pela IA — Capacete, Colete, Óculos e Erros — exibido com legenda e paginação.
- **Eficiência Operacional**: gráfico de radar comparando cinco indicadores-chave do sistema: Precisão da IA, Conexão com o ESP32, Segurança (EPI), Tempo de Resposta e Estabilidade.
- **Matriz de Confusão**: tabela cruzando as classes previstas pela IA com a realidade (ground truth) para Capacete, Colete e Óculos, destacando visualmente os acertos (diagonal) e os erros de classificação (ex.: Colete confundido com Óculos).

## 3. 🎥 Câmera ao Vivo — "Detecção de EPIs em Tempo Real"

Tela de monitoramento ao vivo, onde o vídeo da câmera é exibido e analisado pela IA para identificar o uso correto de equipamentos de proteção.

- **Painel de Câmera ao Vivo**: área de exibição do streaming de vídeo, conectado via WebSocket. Quando não há transmissão, mostra o estado **"Sem sinal transmissão"** e um indicador de status (ex.: "Aguardando").
- **Detecção de EPIs**: painel lateral com checkboxes para selecionar quais equipamentos devem ser monitorados em tempo real — Colete, Óculos, Capacete e Máscara.
- **Status de detecção**: indicador de prontidão do sistema (ex.: "Pronto") e mensagem de espera ("Aguardando detecções...") até que a IA identifique algo no vídeo.

## 4. ⚙️ Configurações

Tela reservada para os ajustes gerais do sistema, atualmente em desenvolvimento.

- Exibe a mensagem **"Configurações (Em breve)"**, indicando que a funcionalidade ainda não foi implementada.
- Espaço previsto para futuras opções como parâmetros de detecção, gerenciamento de usuários, integrações e preferências do sistema.

## 5. 🏠 Início — "Visão Geral e Assistente de IA"

Tela inicial do sistema, com um painel-resumo do estado geral da operação e um assistente conversacional integrado.

- **Painel inicial** (ao fundo): cartões de resumo com indicadores gerais do sistema/setores monitorados.
- **Diálogo com IA**: painel deslizante de chat, onde o assistente analisa proativamente os logs recentes de IoT e sugere ações — por exemplo, oferecendo gerar um relatório de alertas para um setor específico.
- **Campo de mensagem**: entrada de texto ("Digite sua dúvida...") com botão de envio, permitindo que o usuário converse livremente com a IA sobre os dados do sistema.

## 6. 🥽 Cadastro e Consulta de EPI

Tela de gestão completa do ciclo de vida dos Equipamentos de Proteção Individual, dividida em quatro blocos.

- **Cadastro de Novo EPI**: formulário para registrar um novo equipamento, com campos como Nome do Equipamento, Número do CA (Certificado de Aprovação), Fabricante, Modelo, Descrição Detalhada, upload de foto, Categoria, Tamanho/Especificações e Zonas de Risco Recomendadas. Possui os botões **Registrar** e **Cancelar**.
- **Consulta de EPI por Colaborador**: campo de busca por nome do empregador ou ID, e uma tabela listando colaborador, ID, setor, EPI atribuído e status do CA — útil para verificar rapidamente quem está usando qual equipamento e sua situação de conformidade.
- **Resumo do EPI**: cartão de detalhes do equipamento selecionado, com foto, modelo, fabricante e números de identificação/certificação (CH e CA).
- **Prescrições de Uso**: lista de recomendações de treinamento associadas ao EPI (ex.: uso e manutenção anual, procedimentos de emergência semestrais, diretrizes de instalação anuais) e diretrizes departamentais complementares.

---

## 🔗 Relação entre Telas e Casos de Uso

Esta seção cruza os casos de uso (UC01 a UC08) do diagrama de casos de uso do sistema com as telas descritas acima, mostrando onde cada caso de uso é disparado, exibido ou consumido na interface.

### Tabela de Referência

| Caso de Uso | Descrição | Tela(s) relacionada(s) | Como se manifesta na interface |
|---|---|---|---|
| **UC01** | Capturar feed da câmera | Câmera ao Vivo | Painel "Câmera ao Vivo" exibe o streaming recebido via WebSocket (ou o estado "Sem sinal transmissão" quando a Câmera Industrial não está conectada). |
| **UC02** | Detectar EPI e classificar a classe | Câmera ao Vivo | Painel lateral "Detecção de EPIs" define quais classes (Colete, Óculos, Capacete, Máscara) serão monitoradas; o resultado da classificação aparece no status ("Pronto" / "Aguardando detecções..."). |
| **UC03** | Emitir alerta sonoro e visual | Câmera ao Vivo → Dashboard / Análise | O disparo do alerta gera uma entrada na Central de Logs do Dashboard (ex.: "Segurança: Operário detectado sem capacete na Zona B"). |
| **UC04** | Receber o alerta no maquinário | *(sem tela própria)* | Ocorre fisicamente no maquinário do Operador, fora da interface web — só é rastreável indiretamente pelos registros na Central de Logs. |
| **UC05** | Armazenar os dados no Dashboard | Dashboard / Análise | Base de dados que alimenta os gráficos "Análise Composta", "Gráfico de Detecções", "Eficiência Operacional" e "Matriz de Confusão". |
| **UC06** | Armazenar os frames | *(sem tela própria)* | Função de armazenamento de evidências em back-end; ainda não há uma tela dedicada (ex.: galeria/histórico de frames capturados) na documentação atual. |
| **UC07** | Monitorar Dashboard | Dashboard / Análise, Início | Tela principal consumida pelo Supervisor; um resumo equivalente também aparece nos cartões da tela Início. |
| **UC08** | Exportar relatório de conformidade | Dashboard / Análise, Início | Botão **"Gerar Relatório"** na Central de Logs (Dashboard); alternativamente pode ser disparado pelo Assistente de IA na tela Início (ex.: "Deseja que eu gere um relatório de alertas no Setor 1A?"). |

### Fluxo por Ator

- **Câmera Industrial** → UC01 → alimenta o painel da tela **Câmera ao Vivo**.
- **Operador** → UC04 → recebe o alerta no maquinário (fora da UI), evento refletido na Central de Logs do **Dashboard**.
- **Supervisor** → UC07 → consome a tela **Dashboard / Análise** (e o resumo na tela **Início**).
- **Gestor** → UC08 → aciona o relatório a partir do **Dashboard / Análise** ou via **Assistente de IA** (tela Início).

### Lacunas Identificadas

- **UC04** e **UC06** ainda não possuem uma tela própria documentada. Pode ser interessante avaliar, por exemplo, uma tela de "Galeria de Evidências" para os frames armazenados (UC06).
- As telas **Login**, **Configurações** e **Cadastro/Consulta de EPI** não fazem parte deste diagrama de casos de uso — são funcionalidades complementares de acesso e gestão de catálogo, não diretamente ligadas ao fluxo de detecção representado.

---

> 💡 **Observação:** algumas legendas de ícones (como o botão "DYNAMIC" e o ícone verde de maleta) foram interpretadas visualmente a partir do mockup, já que não possuem rótulo de texto explícito. Ajuste essas descrições conforme a funcionalidade real implementada.
