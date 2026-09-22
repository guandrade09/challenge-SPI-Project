# Reunião da Segunda Entrega - Challenge Codexis 

Data: 22/06/2026 
Modalidade: Remota 
Participantes: Equipe Codexis
Pauta: Revisão do segundo ciclo de desenvolvimento e validação da segunda entrega do projeto

## 1. Abertura

Reunião destinada a avaliar o avanço dos módulos centrais de visão computacional (detecção de EPI, pose estimation e zona de perigo), além da consolidação dos dados de logs e configurações do sistema.

## 2. Itens discutidos por frente

### Machine Learning

Detecção de EPI — concluído. Modelo de detecção de equipamentos de proteção individual validado.
Pose Estimation — concluído. Módulo de estimativa de pose integrado ao pipeline de inferência.
Zona de Perigo — concluído. Delimitação e detecção de zonas de risco implementadas.
Testes e Retreino dos modelos — em validação. Ciclo de testes e retreino dos modelos de ML finalizado a tempo da entrega porém prolongado para próxima entrega.
Melhoria na latência na inferência — em andamento. Otimizações de performance ainda em execução na data da reunião.

### Interface

Atualização de gráficos e elementos visuais — concluído. Dashboard atualizado com novos gráficos de visualização.

### API Central

Integrar os dados de Logs com os gráficos — concluído. Integração entre backend de logs e camada visual concluída.
Controle das configurações do ML — concluído. Painel de configuração dos parâmetros de ML disponibilizado.

### Sistema de Logs

Logs para zona de perigo e riscos ergonômicos — concluído. Registro de eventos de zona de perigo e riscos ergonômicos implementado.
3. Decisões tomadas
Aprovação da entrega 2, com os três principais módulos de visão computacional (EPI, pose e zona de perigo) funcionais.
A tarefa Melhoria na latência na inferência, ainda em andamento, foi mantida como item de acompanhamento para o próximo ciclo.
4. Pendências e próximos passos
Concluir a otimização de latência de inferência.
Iniciar a Ampliação do Dataset e o Sistema de auditoria e validação.
Planejar a entrada da frente de Hardware (notificação via ESP32).
