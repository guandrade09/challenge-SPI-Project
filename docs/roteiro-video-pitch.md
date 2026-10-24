[Voltar ao README](/README.md)

# 🎬 Roteiro — Vídeo Pitch (Challenge SPI / FIAP)

**Duração máxima:** 5:00 min
**Formato de entrega:** vídeo no YouTube (link com acesso garantido) + apresentação em PDF
**Base:** slides em PowerPoint/similar, narrados em tela + demonstração ao vivo do protótipo

> Regra de ouro do enunciado: **o item 4 (demonstração do protótipo) é o que mais importa.** Os demais itens existem só para contextualizar. Por isso a distribuição de tempo abaixo reserva a maior fatia (quase metade do vídeo) para a demo.

---

## Distribuição de tempo (total 5:00)

| # | Bloco | Duração | Acumulado |
|---|---|---|---|
| 0 | Abertura + equipe | 0:15 | 0:15 |
| 1 | Proposta / desafio | 0:30 | 0:45 |
| 2 | Funcionalidades inovadoras | 0:30 | 1:15 |
| 3 | Arquitetura da solução (A + B) | 0:45 | 2:00 |
| 4 | **Demonstração do protótipo** | **2:20** | 4:20 |
| 5 | Perspectivas (o que falta) | 0:25 | 4:45 |
| 6 | Principais códigos | 0:15 | 5:00 |

Ajuste os segundos durante o ensaio — cronometrar é obrigatório, o corte automático em 5:00 é implacável.

---

## Elenco / quem fala em cada bloco

Distribuído para que **todo mundo apareça** falando pelo menos uma vez (ajustem entre vocês conforme afinidade com o assunto):

- **Bloco 0 (abertura/equipe):** todo o time, uma frase cada (nome + papel no projeto)
- **Bloco 1 (proposta):** Geovana
- **Bloco 2 (funcionalidades):** Gustavo Andrade
- **Bloco 3 (arquitetura):** Lucas Santos Rodrigues (stack) + Geovana (diagrama/ML)
- **Bloco 4 (demo):** Gabriel Lacerda (frontend/fluxo) + Geovana (ML/veredito) revezando
- **Bloco 5 (perspectivas):** Mayene Gabrielle
- **Bloco 6 (código):** Thais Helena

---

## Preparação antes de gravar (checklist)

- [ ] Subir os 3 processos localmente e testar o fluxo completo **uma vez sem gravar**: `backend` (`npm run dev`, porta 3000), `frontend` (`npm run dev`, porta 3300), `orquestrador` (`python orquestrador/main.py`)
- [ ] Ter pelo menos 1 EPI físico (capacete) à mão pra colocar/tirar durante a demo e provocar a troca de veredito ao vivo
- [ ] Zona de risco já configurada previamente (evita perder tempo configurando na gravação)
- [ ] Ter um incidente antigo já registrado no banco pra mostrar a tela de Logs/Relatório sem precisar esperar gerar um novo na hora
- [ ] Testar a exportação de PDF/Excel do relatório **antes** de gravar (é um dos pontos que já quebrou por falta de dependência — ver histórico do projeto)
- [ ] Fechar programas pesados no notebook (câmera + inferência já consome bastante CPU/GPU) pra não travar durante a gravação
- [ ] Gravar em partes (cada bloco separado) e editar depois — mais seguro do que tentar uma tomada única de 5 minutos
- [ ] Deixar o PowerPoint pronto **antes**: slides de título, equipe, problema, funcionalidades, arquitetura (com o diagrama exportado do `docs/diagramas/arquitetura-solucao.drawio`), perspectivas e "próximos passos"

---

## BLOCO 0 — Abertura + Equipe (0:00–0:15)

**Tela:** slide de título do projeto + foto/nome de cada integrante

**Fala (todos, uma frase cada, rápido):**

> "Olá! Somos o time do Challenge SPI da FIAP. Eu sou [nome], responsável por [frente]." *(repete pra cada um dos 6 integrantes — Gabriel Lacerda, Geovana Pederneschi, Gustavo Andrade, Lucas Santos Rodrigues, Mayene Gabrielle, Thais Helena)*

---

## BLOCO 1 — Proposta do Projeto (0:15–0:45)

**Tela:** slide com estatística/foto de acidente de trabalho (genérica, sem expor empresa real) + normas NR-6/NR-12

**Fala (Geovana):**

> "O desafio do Challenge SPI é reduzir acidentes de trabalho em ambientes industriais usando visão computacional. A legislação brasileira — NR-6 e NR-12 — exige uso correto de EPI e controle de zonas de risco, mas a fiscalização manual é falha: depende de alguém estar olhando no momento exato em que o operador tira o capacete ou entra numa área perigosa.
>
> Nosso sistema resolve isso monitorando continuamente, em tempo real, três frentes de risco ao mesmo tempo: uso de EPI, postura ergonômica do operador e invasão de zona de perigo — e converte tudo isso num veredito único e imediato: Monitorando, Alerta, Aprovado ou Rejeitado."

---

## BLOCO 2 — Funcionalidades Inovadoras (0:45–1:15)

**Tela:** slide com os 4 ícones/funcionalidades

**Fala (Gustavo):**

> "O que torna o projeto diferente de um detector de capacete simples é a **fusão de múltiplos modelos de IA num único veredito por frame**, em vez de alarmes soltos e desconexos.
>
> Temos: detecção de EPI com YOLOv8 treinado com nosso próprio dataset; análise ergonômica em tempo real usando o método REBA sobre o esqueleto do operador; delimitação de zona de perigo configurável pela própria interface; e detecção de queda do operador.
>
> Outro diferencial: suportamos **câmera dupla simultânea** — uma frontal e uma lateral, incluindo câmeras IP reais via RTSP — com dois modos de operação configuráveis: câmeras vendo o mesmo posto por ângulos diferentes, ou câmeras cobrindo áreas independentes. Além disso, todo incidente vira log com imagem, timestamp e é consultável depois, com exportação de relatório em PDF e Excel, e temos um chat com IA integrado pra tirar dúvidas sobre os dados monitorados."

---

## BLOCO 3 — Arquitetura da Solução (1:15–2:00)

### 3A — Tecnologias (0:20)

**Tela:** slide com logos/lista das tecnologias por camada

**Fala (Lucas):**

> "Na camada de inferência usamos Python com YOLOv8 (biblioteca Ultralytics) e OpenCV, além da Shapely pra geometria da zona de risco. O orquestrador central concentra toda a lógica de decisão e expõe um servidor WebSocket pra transmitir vídeo e veredito em tempo real.
>
> O backend é Node.js com Express e banco SQLite, com autenticação JWT, e geração de relatórios em PDF e Excel. O frontend é React com Vite, Zustand pra estado e Tailwind pra interface. Pra apoiar o desenvolvimento, usamos Roboflow pra rotulagem do dataset de EPI, Git/GitHub pra versionamento e VS Code como IDE principal."

### 3B — Diagrama da solução (0:25)

**Tela:** abrir/exportar `docs/diagramas/arquitetura-solucao.drawio` em tela cheia

**Fala (Geovana):**

> "Neste diagrama dá pra ver o fluxo completo: as câmeras — webcam, celular ou câmeras IP — alimentam o orquestrador em Python, que roda os modelos de EPI, ergonomia, zona e queda em paralelo e agrega tudo num veredito único. Esse veredito e o vídeo anotado seguem por WebSocket direto pro frontend em tempo real, enquanto os incidentes confirmados são persistidos via API REST no backend Node, que grava no SQLite e gera os relatórios."

---

## BLOCO 4 — Demonstração do Protótipo (2:00–4:20) ⭐ PARTE PRINCIPAL

**Tela:** captura de tela ao vivo do sistema rodando (não slide)

> Dica: façam essa parte com tela cheia do navegador/app, sem cortar pra slide no meio — é o que o avaliador mais quer ver.

**4.1 — Login e tela de monitoramento (0:20)**
**Fala (Gabriel):**
> "Aqui estamos logados no sistema. Essa é a tela de Monitoramento, com o carrossel de câmeras cadastradas — cada uma com um papel, frontal ou lateral."

*Ação: logar, mostrar o carrossel, clicar na câmera principal.*

**4.2 — Detecção de EPI ao vivo (0:30)**
**Fala (Geovana):**
> "Aqui o modelo está analisando o vídeo em tempo real. Reparem no bounding box e no label — no momento eu **não estou usando o capacete**, e o sistema já classifica isso como risco."

*Ação: tirar o capacete na frente da câmera → mostrar o veredito mudando de APROVADO/MONITORANDO para ALERTA/REJEITADO em tempo real → colocar o capacete de volta e mostrar retornando ao normal.*

**4.3 — Ergonomia (REBA) e zona de risco (0:35)**
**Fala (Gabriel):**
> "Na câmera lateral, o sistema desenha o esqueleto do operador e calcula os ângulos de postura pelo método REBA — inclinações inadequadas de tronco e pescoço geram alerta ergonômico. Também temos a zona de risco configurável: se alguém entra na área marcada, o sistema aciona o alerta imediatamente."

*Ação: mostrar o overlay do esqueleto, entrar na zona marcada, mostrar o alerta de invasão de zona disparando.*

**4.4 — Painel de alertas e histórico (0:25)**
**Fala (Geovana):**
> "Todo alerta confirmado aparece no painel lateral e é registrado como incidente, com imagem e horário exatos."

*Ação: mostrar o `AlertPanel` atualizando, abrir a tela de Logs.*

**4.5 — Relatórios e exportação (0:20)**
**Fala (Gabriel):**
> "Na tela de logs conseguimos filtrar o histórico de incidentes e exportar um relatório completo em PDF ou Excel."

*Ação: abrir modal de relatório, clicar em exportar PDF (arquivo já deve abrir/baixar sem erro — testado antes).*

**4.6 — Chat com IA (0:10)**
**Fala (Geovana):**
> "E temos um chat com IA integrado, que responde perguntas sobre os dados monitorados direto na plataforma."

*Ação: abrir o `AiChatSidebar`, fazer uma pergunta rápida, mostrar a resposta.*

> Se qualquer uma dessas partes ainda estiver instável na hora de gravar (ex.: câmera lateral com RTSP oscilando), **mostrem mesmo assim e falem isso com naturalidade** — o enunciado pede exatamente isso: "apresente mesmo que a solução esteja parcialmente funcionando".

---

## BLOCO 5 — Perspectivas (4:20–4:45)

**Tela:** slide "Próximos passos"

**Fala (Mayene):**

> "Pra fechar o projeto, ainda faltam alguns pontos: formalizar a meta de latência de processamento e implementar a limpeza automática de logs antigos, que são requisitos não funcionais pendentes. Também precisamos remover um pipeline antigo de EPI que já foi substituído pelo orquestrador atual, mas ainda está no repositório, e refinar a checagem de zona de risco pra funcionar de forma independente em cada câmera, não só na lateral. Testamos aceleração via TensorRT, mas a GPU disponível no ambiente de teste não teve memória suficiente — então seguimos com a aceleração via CUDA padrão, que já atende bem à latência que precisamos."

---

## BLOCO 6 — Principais Códigos (4:45–5:00)

**Tela:** trocar rapidamente entre 2–3 trechos de código no editor (zoom no texto)

**Fala (Thais):**

> "Só pra ilustrar tecnicamente: aqui está a função `_aggregate()` do orquestrador, o coração do sistema — é ela que recebe as leituras de EPI, ergonomia, zona e queda, e decide o veredito final. E aqui, no frontend, o componente `CameraView` que desenha o vídeo, o esqueleto e as caixas de detecção em tempo real usando canvas."

*Ação: mostrar `orquestrador/main.py` (função `_aggregate`) e `frontend/src/features/monitoramentoPage/components/CameraView.jsx` por ~5s cada. Fechar com o slide final: nome do projeto + link do repositório.*

---

## Encerramento

**Tela:** slide final com nome do time e "Obrigado!"

Sem fala adicional — corta no slide final dentro dos 5:00.

---

## Notas de produção

- **Gravação de tela:** OBS Studio (gratuito) é suficiente pra capturar tela + webcam da equipe simultaneamente (útil pro Bloco 0).
- **Edição:** cortar os blocos gravados separadamente com qualquer editor simples (DaVinci Resolve gratuito, CapCut, ou até o Clipchamp do Windows).
- **PDF da apresentação:** exportar os slides do PowerPoint direto como PDF (Arquivo → Exportar → Criar PDF/XPS) — é a segunda entrega exigida, separada do vídeo.
- **YouTube:** publicar como **"Não listado"** (não "Privado" — privado não abre pra quem só tem o link) pra garantir que o link funcione pra quem for avaliar.
