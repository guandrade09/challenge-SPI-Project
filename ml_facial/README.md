# ml_facial — Reconhecimento Facial

Módulo de reconhecimento facial, importado diretamente pelo `orquestrador/main.py`
(mesmo padrão de `ml_ergonomia/pose_analyzer.py` e `ml_zona_critica/zone_checker.py`: sem
HTTP, sem processo separado — roda dentro do processo do orquestrador).

## Como funciona

1. `FaceRecognizer` usa **MTCNN** (facenet-pytorch) para detectar e alinhar rostos no
   frame, e **InceptionResnetV1** (pré-treinada em VGGFace2) para gerar um embedding de
   512 dimensões por rosto.
2. `FuncionarioFaceRegistry` sincroniza periodicamente com o backend
   (`GET /api/funcionarios`), calcula o embedding da foto cadastrada de cada funcionário
   que ainda não tem um (`face_encoding` vazio) e grava o resultado de volta
   (`PUT /api/funcionarios/:id`) — assim o cálculo só acontece uma vez por funcionário,
   não a cada reinício do orquestrador.
3. A cada ciclo do pipeline, `FaceRecognizer.identify(frame, known)` compara CADA rosto
   detectado contra os embeddings conhecidos (distância euclidiana) e retorna uma lista
   de `FaceMatch` (`core/entities.py`): reconhecido (com `funcionario_id`), se a
   distância até o melhor candidato for <= `MAX_MATCH_DISTANCE_DEFAULT` (1.0 por padrão),
   ou "Desconhecido" caso contrário. Esse limite existe pra evitar que, com 2+ pessoas em
   cena, o rosto de alguém não cadastrado seja atribuído ao único (ou mais parecido)
   funcionário cadastrado só por ser o candidato mais próximo disponível. A confiança
   exibida (0-100%) é calculada separadamente via similaridade de cosseno, só pra leitura
   humana — não é ela que decide o aceite/rejeição.

Por que facenet-pytorch em vez de `face_recognition`/`dlib`: é 100% PyTorch, sem
dependência de CMake/Visual Studio Build Tools — que costuma travar a instalação no
Windows (SO alvo do projeto, ver `docs/requisitos.md`). O projeto já carrega `torch` via
`ultralytics`, então não é uma dependência pesada nova.

## Instalação

```bash
pip install -r ml_facial/requirements.txt
```

O modelo `InceptionResnetV1(pretrained="vggface2")` é baixado automaticamente pelo
facenet-pytorch na primeira execução (cache em `~/.cache/torch`).

## Uso no orquestrador

```python
from ml_facial.face_recognizer import FaceRecognizer, FuncionarioFaceRegistry

recognizer = FaceRecognizer()
registry   = FuncionarioFaceRegistry(recognizer, backend_url="http://localhost:3000/api/funcionarios")

registry.refresh_if_needed()
matches = recognizer.identify(frame, registry.known_embeddings())
```

Ver `orquestrador/main.py` (`_run_facial_sector`, `_facial_sector_manager`) para o
pipeline completo: debounce por N frames (mesmo mecanismo do EPI/ergonomia/zona), envio
ao vivo das caixas via WebSocket (`send_faces`, pra desenhar nome+caixa na tela de
Câmeras) e POST do reconhecimento confirmado para
`http://localhost:3000/api/reconhecimentos-faciais`.

**Importante — não abre conexão própria com a câmera.** `_run_facial_sector` reuza o
último frame frontal já capturado por `_run_sector` (compartilhado via
`_latest_frontal_frames`), em vez de chamar `_capture_loop` de novo para a mesma
`streamUrl`. Câmeras de rede simples (ex.: apps tipo IP Webcam) costumam suportar só um
cliente de vídeo por vez — uma 2ª conexão à mesma URL derruba ou instabiliza o stream
exibido no frontend. Qualquer nova integração que precise de frames desta câmera deve
seguir o mesmo padrão (ler de um estado compartilhado), nunca abrir uma nova
`cv2.VideoCapture` para a mesma `streamUrl`.

## Limitações conhecidas

- Sem liveness/anti-spoofing: uma foto impressa ou tela pode enganar o reconhecimento.
  Fora de escopo do MVP.
- Cada funcionário pode ter até `MAX_FOTOS_FUNCIONARIO` (3) fotos de referência; mais
  fotos (ângulos/iluminação diferentes) melhoram a precisão do embedding.
- `MAX_MATCH_DISTANCE_DEFAULT` (1.0) foi calibrado com UM funcionário cadastrado via
  câmera Wi-Fi/MJPEG (bastante perda de qualidade); a mesma pessoa mediu distância
  0.84–0.90 contra o feed ao vivo nos testes — valor bem mais alto do que o citado em
  tutoriais com fotos de estúdio (~0.6–0.8), provavelmente por causa da compressão/baixa
  resolução do stream. Ainda não foi validado com uma segunda pessoa (pra confirmar que
  gente não cadastrada fica acima desse limite). Acompanhe o log
  `[FACIAL] rosto → '...' (distância: X.XXX, confiança: X.XX)` e ajuste a constante em
  `face_recognizer.py` conforme necessário.
