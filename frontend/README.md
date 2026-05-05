# FRONTEND (REACT + VITE)

Esta aplicação frontend tem o intuito de ser utilizada para agregar na construção de um WEBSITE de monitoramento para a Industria focado em EPI's ou melhor segurança do trabalho.

# SETUP

Para iniciarmos a aplicação,
1. `cd frontend`
2. `npm install`  (Caso não tenha ainda o node_modules na sua maquina)
3. `npm run dev`  ||  `node start`   

# Árvore de Diretórios

````
📦src
 ┣ 📂assets                                                     < Imagens >
 ┃ ┣ 📜hero.png
 ┃ ┣ 📜react.svg
 ┃ ┗ 📜vite.svg
 ┣ 📂components                                                 < Componentes Gerais >
 ┃ ┣ 📂shared                                                   < Componentes Compartilhados > 
 ┃ ┃ ┣ 📜BasePanel.jsx
 ┃ ┃ ┣ 📜BasePanelModal.jsx
 ┃ ┃ ┣ 📜IconButton.jsx
 ┃ ┃ ┣ 📜IconButtonModal.jsx
 ┃ ┃ ┣ 📜index.jsx
 ┃ ┃ ┣ 📜ListPanel.jsx
 ┃ ┃ ┣ 📜ListPanelModal.jsx
 ┃ ┃ ┗ 📜PopupModal.jsx
 ┃ ┗ 📂ui                                                       < Componentes Atomicos >
 ┃ ┃ ┗ 📜NotificationToast.jsx
 ┣ 📂enums                                                      < Enums para tipagem >
 ┃ ┗ 📜enums.js
 ┣ 📂features                                                   < Features  >
 ┃ ┣ 📂auth                                                     < Paginas c/ Auth>
 ┃ ┃ ┗ 📂registerUserPage                                       < Paginas de UserLogin  >
 ┃ ┃ ┃ ┣ 📜ForgotPassword.jsx
 ┃ ┃ ┃ ┣ 📜index.jsx
 ┃ ┃ ┃ ┣ 📜Login.jsx
 ┃ ┃ ┃ ┗ 📜Register.jsx
 ┃ ┣ 📂chatAi                                                   < Chat Bot  >
 ┃ ┃ ┣ 📜AiChatSidebar.jsx
 ┃ ┃ ┣ 📜AiToggleButton.jsx
 ┃ ┃ ┗ 📜index.jsx
 ┃ ┣ 📂logsPage                                                 < Pagina dos Graficos e Log  >
 ┃ ┃ ┣ 📂components                                             < Componentes Utilizados >
 ┃ ┃ ┃ ┣ 📂graficos                                             < Graficos Secos >
 ┃ ┃ ┃ ┃ ┣ 📜AnomalyScatterChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜AreaDetectionChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜ConfidenceDistribution.jsx
 ┃ ┃ ┃ ┃ ┣ 📜DashboardChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜DetectionBarChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜DetectionComposedChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜DetectionLineChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜index.jsx
 ┃ ┃ ┃ ┃ ┣ 📜InferenceLatencyChart.jsx
 ┃ ┃ ┃ ┃ ┣ 📜MLConfusionMatrix.jsx
 ┃ ┃ ┃ ┃ ┣ 📜OperationalRadar.jsx
 ┃ ┃ ┃ ┃ ┗ 📜ResourceMonitor.jsx
 ┃ ┃ ┃ ┣ 📂painelLog                                            < Painel de Logs com botão 'Gerar Relatorio' >
 ┃ ┃ ┃ ┃ ┣ 📜index.jsx
 ┃ ┃ ┃ ┃ ┣ 📜LogPanel.jsx
 ┃ ┃ ┃ ┃ ┣ 📜LogReportButton.jsx
 ┃ ┃ ┃ ┃ ┣ 📜LogReportModal.jsx
 ┃ ┃ ┃ ┃ ┣ 📜LogSettingsButton.jsx
 ┃ ┃ ┃ ┃ ┗ 📜LogSkeleton.jsx
 ┃ ┃ ┃ ┗ 📜MessageConsole.jsx
 ┃ ┃ ┣ 📂hooks                                                  < Sem utilidade ainda... >
 ┃ ┃ ┣ 📜LogsPage.jsx
 ┃ ┃ ┣ 📜RenderColumn.jsx
 ┃ ┃ ┗ 📜test.js
 ┃ ┗ 📂monitoramentoPage                                        < Pagina de Monitoramento >
 ┃ ┃ ┣ 📂components                                             < Componentes Utilizados >
 ┃ ┃ ┃ ┣ 📜AlertPanel.jsx
 ┃ ┃ ┃ ┣ 📜CameraView.jsx
 ┃ ┃ ┃ ┣ 📜DetectionCard.jsx
 ┃ ┃ ┃ ┣ 📜DetectionPanel.jsx
 ┃ ┃ ┃ ┗ 📜index.jsx
 ┃ ┃ ┣ 📂hooks                                                  < Sem utilidade ainda... >
 ┃ ┃ ┗ 📜MonitoramentoPage.jsx
 ┣ 📂layouts                                                    < Formato da Pagina >
 ┃ ┣ 📜MainLayout.jsx
 ┃ ┗ 📜NavBar.jsx
 ┣ 📂mocks                                                      < Dados Mockados >
 ┃ ┣ 📂logsPageMocks                                            < Dados Mockados para os Graficos >
 ┃ ┃ ┗ 📜test.js
 ┣ 📂routes                                                     < Metodo para garantir o Login >
 ┃ ┗ 📜PrivateRoute.jsx
 ┣ 📂store                                                      < Funções Zustand para Armazenar o comportamento do Usuário >
 ┃ ┣ 📜useAuthStore.js
 ┃ ┣ 📜useMonitoramentoStore.js
 ┃ ┗ 📜useUiStore.js
 ┣ 📂styles                                                     < Estilos especificos montados manualmente >
 ┣ 📂utils                                                      < Funções para facilitar a modelagem do FrontEnd >
 ┃ ┗ 📜cn.js
 ┣ 📜App.jsx                                                    < Logica do funcionamento do Site >
 ┣ 📜index.css                                                  < CSS cru para aplicações e facilidade em leitura em USO GERAL >
 ┗ 📜main.jsx                                                   < Logica para envolver o site em UI geral >
```
