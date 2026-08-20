---
description: Sobe o projeto SPI completo (backend, frontend, orquestrador). Use quando a usuária pedir pra "subir o projeto", "startar tudo", "ligar os serviços" ou variações disso.
---

# Skill: start-spi

Sobe os três serviços do projeto SPI na ordem correta, verificando antes se já estão rodando.

## Configuração do ambiente

- **Projeto:** `C:\Users\Geovana\Documents\codexis-spi\challenge-SPI-Project`
- **Venv Python:** `C:\Users\Geovana\Documents\codexis-spi\.venv\Scripts\python.exe`
- **Backend:** porta 3000 — `NO_CLUSTER=1 node src/api/server.js` (rodado de dentro de `backend/`)
- **Frontend:** porta 3300 — `npm run dev` (rodado de dentro de `frontend/`)
- **Orquestrador:** porta 8765 (WebSocket) — `python orquestrador/main.py` (rodado da raiz do projeto, **não** como módulo `-m`, pois `config_server.py` usa import relativo)

## Passos

### 1. Verificar o que já está rodando

Execute:
```bash
netstat -ano 2>/dev/null | grep -E "LISTENING" | grep -E ":(3000|3300|8765)"
```

Para cada porta que já estiver escutando, informe à usuária e **não** tente subir aquele serviço de novo.

### 2. Subir o backend (se porta 3000 livre)

```bash
cd /c/Users/Geovana/Documents/codexis-spi/challenge-SPI-Project/backend
nohup env NO_CLUSTER=1 node src/api/server.js > /tmp/backend.log 2>&1 &
```

Aguarde ~4 segundos e confirme com `netstat` que a porta 3000 está LISTENING.

### 3. Subir o frontend (se porta 3300 livre)

```bash
cd /c/Users/Geovana/Documents/codexis-spi/challenge-SPI-Project/frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
```

Aguarde ~4 segundos e confirme que a porta 3300 está LISTENING.

### 4. Subir o orquestrador (se porta 8765 livre)

```bash
cd /c/Users/Geovana/Documents/codexis-spi/challenge-SPI-Project
nohup /c/Users/Geovana/Documents/codexis-spi/.venv/Scripts/python.exe orquestrador/main.py > /tmp/orquestrador.log 2>&1 &
```

Aguarde ~8 segundos (o orquestrador carrega os modelos YOLO) e confirme que a porta 8765 está LISTENING.

> **Atenção:** se a porta 8765 não aparecer após 10s, leia `/tmp/orquestrador.log` para ver o erro. Causas comuns: câmeras RTSP inacessíveis (normal se nenhuma câmera estiver ligada), modelo `.pt` não encontrado no diretório `orquestrador/`.

### 5. Resumo final

Após verificar tudo, exiba uma tabela com status de cada serviço:

| Serviço | Porta | Status |
|---|---|---|
| Backend (Node/Express) | 3000 | ✅/❌ |
| Frontend (Vite/React) | 3300 | ✅/❌ |
| Orquestrador (WebSocket) | 8765 | ✅/❌ |

E informe: **Frontend disponível em http://localhost:3300**

## Notas importantes

- O backend **não** usa cluster por padrão localmente — `NO_CLUSTER=1` evita spawnar N processos Node desnecessariamente.
- O orquestrador **deve** ser chamado como `python orquestrador/main.py` (script direto), **não** como `python -m orquestrador.main` (módulo), porque `config_server.py` dentro de `orquestrador/` usa `import config_server` sem prefixo de pacote.
- A venv fica em `codexis-spi/.venv` (um nível acima da pasta do projeto), não dentro do projeto em si.
- Se o orquestrador travar no carregamento de câmeras RTSP, é normal — as câmeras físicas (Quarto Frontal / Cozinha Lateral) precisam estar na mesma rede Wi-Fi.
