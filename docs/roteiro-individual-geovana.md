[Voltar ao README](/README.md)

# 🎙️ Roteiro Individual — Geovana (Vídeo Pitch Challenge SPI)

Guia pra você gravar sozinha, no formato **🗣️ Falar** / **🎥 Mostrar**. Duração alvo: **5:00 min**.

> Não decore palavra por palavra — leia algumas vezes, cronometre, e fale com suas palavras seguindo os pontos. Se algum colega for gravar um trecho junto (ex.: alguém do fullstack narrando a parte de arquitetura/backend), é só pular aquele bloco na hora da edição — o roteiro completo funciona sozinho.

---

## Antes de gravar

- [ ] Backend rodando (`npm run dev` na pasta `backend`, porta 3000)
- [ ] Frontend rodando (`npm run dev` na pasta `frontend`, porta 3300)
- [ ] Orquestrador rodando (`python orquestrador/main.py`)
- [ ] Capacete físico à mão (pra tirar/colocar na frente da câmera)
- [ ] Zona de risco já configurada antes de gravar
- [ ] 1 incidente antigo já no banco, pra não depender de gerar um novo na hora
- [ ] Testar exportação de PDF/Excel do relatório uma vez antes de gravar
- [ ] Fechar programas pesados (a inferência já consome bastante CPU/GPU)
- [ ] Gravar em blocos separados (não precisa ser uma tomada única de 5min)

---

## 0:00–0:15 — Abertura

**🎥 Mostrar:** slide de título + slide da equipe

**🗣️ Falar:**
> "Oi! Eu sou a Geovana, e esse é o projeto que eu e meu time desenvolvemos pro Challenge SPI da FIAP — um sistema de visão computacional pra segurança industrial. Comigo no projeto: Gabriel Lacerda, Gustavo Andrade e Lucas Rodrigues no desenvolvimento fullstack, e Mayene Doria e Thais Vieira comigo na parte de Machine Learning."

---

## 0:15–0:45 — O Desafio

**🎥 Mostrar:** slide "O Desafio" (contexto NR-6/NR-12)

**🗣️ Falar:**
> "O desafio é reduzir acidentes de trabalho em ambientes industriais. A legislação — NR-6 e NR-12 — exige uso correto de EPI e controle de zonas de risco, mas a fiscalização manual falha: ninguém consegue observar o operador o tempo todo.
>
> Nosso sistema resolve isso monitorando continuamente, em tempo real, três frentes de risco ao mesmo tempo: uso de EPI, postura ergonômica do operador e invasão de zona de perigo — tudo isso convertido num veredito único e imediato: Monitorando, Alerta, Aprovado ou Rejeitado."

---

## 0:45–1:15 — Funcionalidades Inovadoras

**🎥 Mostrar:** slide de funcionalidades (ícones)

**🗣️ Falar:**
> "O que diferencia esse projeto de um detector de capacete simples é a fusão de múltiplos modelos de IA num único veredito por frame, em vez de alarmes soltos.
>
> Temos detecção de EPI com YOLOv8 treinado com dataset próprio, análise ergonômica em tempo real pelo método REBA sobre o esqueleto do operador, zona de perigo configurável direto pela interface, e detecção de queda.
>
> Também suportamos câmera dupla simultânea — frontal e lateral, incluindo câmeras IP reais via RTSP — com dois modos: câmeras vendo o mesmo posto por ângulos diferentes, ou cobrindo áreas independentes. E todo incidente vira log consultável, com relatório exportável em PDF e Excel, além de um chat com IA integrado."

---

## 1:15–2:00 — Arquitetura da Solução

**🎥 Mostrar:** slide de tecnologias (0:20) → depois o diagrama em tela cheia (0:25)

**🗣️ Falar (tecnologias):**
> "Na inferência usamos Python com YOLOv8 da Ultralytics, OpenCV e Shapely pra geometria da zona de risco. O orquestrador central concentra a lógica de decisão e expõe um WebSocket pra transmitir vídeo e veredito em tempo real.
>
> O backend é Node.js com Express e SQLite, com autenticação JWT e geração de relatórios em PDF e Excel. O frontend é React com Vite, Zustand e Tailwind."

**🗣️ Falar (diagrama):**
> "Nesse diagrama dá pra ver o fluxo completo: as câmeras alimentam o orquestrador em Python, que roda os modelos de EPI, ergonomia, zona e queda em paralelo e agrega tudo num veredito único. Esse veredito e o vídeo anotado seguem por WebSocket direto pro frontend em tempo real, enquanto os incidentes confirmados são gravados via API REST no backend."

---

## 2:00–4:20 — Demonstração ao Vivo ⭐ (parte principal — quase metade do vídeo)

**🎥 Mostrar:** tela cheia do sistema rodando, sem cortar pra slide no meio

### 2:00–2:20 — Login e tela de monitoramento
**🎥 Mostrar:** logar, mostrar o carrossel de câmeras, clicar na câmera principal
**🗣️ Falar:**
> "Aqui estamos logados no sistema. Essa é a tela de Monitoramento, com o carrossel de câmeras cadastradas — cada uma com um papel, frontal ou lateral."

### 2:20–2:50 — Detecção de EPI ao vivo
**🎥 Mostrar:** tirar o capacete na frente da câmera → veredito mudando de APROVADO/MONITORANDO pra ALERTA/REJEITADO → colocar o capacete de volta
**🗣️ Falar:**
> "O modelo está analisando o vídeo em tempo real. Reparem no bounding box e no label — agora eu não estou usando o capacete, e o sistema já classifica isso como risco."
> *(coloca o capacete de volta)* "E assim que eu coloco de volta, o veredito volta ao normal."

### 2:50–3:25 — Ergonomia (REBA) e zona de risco
**🎥 Mostrar:** overlay do esqueleto na câmera lateral, entrar na zona marcada, alerta de invasão disparando
**🗣️ Falar:**
> "Na câmera lateral, o sistema desenha o esqueleto e calcula os ângulos de postura pelo método REBA — inclinações inadequadas de tronco e pescoço geram alerta ergonômico. Temos também a zona de risco configurável: se eu entro na área marcada, o alerta é acionado imediatamente."

### 3:25–3:50 — Painel de alertas e histórico
**🎥 Mostrar:** `AlertPanel` atualizando, abrir tela de Logs
**🗣️ Falar:**
> "Todo alerta confirmado aparece no painel lateral e vira um incidente registrado, com imagem e horário exatos."

### 3:50–4:10 — Relatórios
**🎥 Mostrar:** abrir modal de relatório, exportar PDF
**🗣️ Falar:**
> "Na tela de logs dá pra filtrar o histórico e exportar um relatório completo em PDF ou Excel."

### 4:10–4:20 — Chat com IA
**🎥 Mostrar:** abrir `AiChatSidebar`, fazer uma pergunta rápida
**🗣️ Falar:**
> "E temos um chat com IA integrado, que responde perguntas sobre os dados monitorados direto na plataforma."

> Se alguma parte estiver instável na hora de gravar (ex.: câmera lateral via RTSP oscilando), mostre mesmo assim e fale com naturalidade — o enunciado pede exatamente isso: apresentar mesmo que a solução esteja parcialmente funcionando.

---

## 4:20–4:45 — Perspectivas

**🎥 Mostrar:** slide "Próximos passos"

**🗣️ Falar:**
> "Pra fechar o projeto, ainda faltam alguns pontos: formalizar a meta de latência de processamento e implementar limpeza automática de logs antigos. Também precisamos remover um pipeline antigo de EPI que já foi substituído pelo orquestrador atual, e refinar a checagem de zona de risco pra funcionar de forma independente em cada câmera. Testamos aceleração via TensorRT, mas a GPU do ambiente de teste não teve memória suficiente — seguimos com CUDA padrão, que já atende bem à latência necessária."

---

## 4:45–5:00 — Principais Códigos

**🎥 Mostrar:** trocar entre 2 trechos de código no editor (zoom no texto): `_aggregate()` no `orquestrador/main.py` e `CameraView.jsx` no frontend

**🗣️ Falar:**
> "Pra ilustrar: aqui está a função `_aggregate` do orquestrador, o coração do sistema — é ela que recebe as leituras de EPI, ergonomia, zona e queda, e decide o veredito final. E aqui, no frontend, o componente que desenha o vídeo, o esqueleto e as caixas de detecção em tempo real."

**🎥 Mostrar:** slide final (nome do projeto + "Obrigado!")

---

## Dicas rápidas pra gravação solo

- Grave o Bloco 4 (demo) primeiro e separado — é o mais sujeito a imprevisto (câmera, iluminação, capacete à mão) e o mais importante do vídeo.
- Fale olhando pra câmera/webcam nos blocos de abertura e encerramento; nos blocos de demo, a narração pode ser só em áudio por cima da tela gravada.
- Se travar ou errar uma fala, pare, respire e repita a frase — corta na edição depois, não precisa regravar o bloco inteiro.
- Cronometre cada bloco separadamente durante o ensaio; ajuste o texto (não o ritmo da fala) se estourar o tempo.
