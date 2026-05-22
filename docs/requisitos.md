[Voltar ao README](/README.md)

# 📋 Levantamento de Requisitos

---

## Restrições do Sistema

| Categoria | Restrição |
|---|---|
| **Hardware** | O MVP opera em computador com CPU Intel Core i5 ou superior (sem GPU dedicada obrigatória); GPU recomendada para produção |
| **Câmeras** | Compatível com câmeras USB (V4L2) ou câmeras CFTV por Wi-Fi |
| **Conectividade** | A inferência é local (edge); não requer conexão com internet durante operação |
| **Banco de dados** | SQLite no MVP |
| **Sistema Operacional** | Windows 10+; Python 3.10+ |
| **Regulatório** | Todas as funcionalidades devem estar em conformidade com NR-6, NR-12 e LGPD |
| **Escopo do MVP** | Sprint 1 cobre apenas detecção de capacete; outros EPIs são previstas em sprints futuras |

## Tabela de Requisitos

| ID | Tipo | Requisito | Descrição | Prioridade | Status |
| --- | --- | --- | --- | --- | --- |
| RF\-01 | Funcional | Modelo ML de Detecção de EPI | Implementar modelo de Machine Learning para classificação binária utilizando a biblioteca OpenCV e o modelo YOLOv11| Alta | Done |
| RF\-02 | Funcional | Modelo ML de Risco Ergonômico | Implementar modelo de Machine Learning para tracking de postura ergonômica do operador | Alta | In\-progress |
| RF\-03 | Funcional | Modelo ML de Zona de Perigo | Implementar modelo de Machine Learning para delimitar zona de perigo no worksite | Alta | In\-progress |
| RF\-04 | Funcional | Interface de Captura de Vídeo | Desenvolver interface para captura de câmera em tempo real com suporte a webcam e câmera do celular | Alta | Done |
| RF\-05 | Funcional | Overlay Visual de Feedback | Implementar sobreposição visual com feedback da detecção em tempo real \(Bounding Box e Label\) | Alta | In\-progress |
| RF\-06 | Funcional | Sistema de Alerta Visual | Criar sistema de alertas visuais quando capacete não for detectado \(bordas vermelhas, ícone de aviso, caixa de notificação\) | Média | In\-progress |
| RF\-07 | Funcional | Registro de Incidentes | Implementar sistema de logging que registra timestamp, captura de imagem e ID da máquina quando o risco é detectado | Baixa |  |
| RF\-08 | Funcional | Armazenamento de Logs | Desenvolver mecanismo de persistência de logs em banco de dados e sistema de arquivos | Baixa | Done |
| RF\-09 | Funcional | Consulta de Logs | Criar seção de consulta e recuperação de logs de incidentes | Baixa | In\-progress |
| RNF\-01 | Não Funcional | Acurácia de Detecção | Sistema deve atingir métricas mínimas de performance: precision ≥80%, recall ≥75% para detecção de capacete | Alta | In\-progress |
| RNF\-02 | Não Funcional | Latência de Processamento | Diminuir o tempo real do processamento entre captura do frame e exibição do resultado | Alta |  |
| RNF\-03 | Não Funcional | Ciclo de Limpeza de Dados | Logs e imagens devem ser retidos por no mínimo 30 dias; política de limpeza automática configurável | Média |  |
| RNF\-04 | Não Funcional | Compatibilidade com celular | Ampliar o escopo do funcionamento para celular | Baixa |  |
| RNF\-05 | Não Funcional | Armazenar os frames direto no OneDrive | Criar uma coluna no banco de dados que indique o link para o OneDrive de cada frame | Baixa |  |
