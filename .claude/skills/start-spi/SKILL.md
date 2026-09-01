---
description: Sobe o projeto SPI completo (backend, frontend, orquestrador). Use quando a usuária pedir pra "subir o projeto", "startar tudo", "ligar os serviços" ou variações disso.
---

# Skill: start-spi

Sobe os três serviços do projeto SPI na ordem correta, derrubando qualquer processo que já ocupe as portas antes de subir.

## Configuração do ambiente

- **Projeto:** `C:\Users\Geovana\Documents\codexis-spi\challenge-SPI-Project`
- **Venv Python:** `C:\Users\Geovana\Documents\codexis-spi\.venv\Scripts\python.exe`
- **Backend:** porta 3000 — `NO_CLUSTER=1 node src/api/server.js` (rodado de dentro de `backend/`)
- **Frontend:** porta 3300 — `npm run dev` (rodado de dentro de `frontend/`)
- **Orquestrador:** porta 8765 (WebSocket) — `python orquestrador/main.py` (rodado da raiz do projeto, **não** como módulo `-m`, pois `config_server.py` usa import relativo)

## Passos

### 1. Liberar as portas (SEMPRE — independente se está rodando ou não)

`taskkill /F` via bash falha silencioso no Windows. Usar **PowerShell** `Stop-Process` que é confiável:

```powershell
# Mata pelo PID de cada porta ocupada
$ports = @(3000, 3300, 8765)
foreach ($port in $ports) {
    $pids = (netstat -ano | Select-String "LISTENING" | Select-String ":$port\s") |
            ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$') {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            Write-Host "Killed PID $p (porta $port)"
        }
    }
}
Start-Sleep -Seconds 2
netstat -ano | Select-String ":(3000|3300|8765)"
```

Confirme que **nenhuma** das três portas aparece como LISTENING antes de continuar.

> **Atenção:** se a porta ainda aparecer após o `Stop-Process`, pode ser um processo protegido. Nesse caso peça à usuária para fechar o processo manualmente no Gerenciador de Tarefas.

### 2. Subir o backend

```bash
cd /c/Users/Geovana/Documents/codexis-spi/challenge-SPI-Project/backend
nohup env NO_CLUSTER=1 node src/api/server.js > /tmp/backend.log 2>&1 &
```

Aguarde ~4 segundos e confirme com `netstat` que a porta 3000 está LISTENING.

### 3. Subir o frontend

```bash
cd /c/Users/Geovana/Documents/codexis-spi/challenge-SPI-Project/frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
```

Aguarde ~4 segundos e confirme que a porta 3300 está LISTENING.

### 4. Subir o orquestrador

```bash
cd /c/Users/Geovana/Documents/codexis-spi/challenge-SPI-Project
nohup /c/Users/Geovana/Documents/codexis-spi/.venv/Scripts/python.exe orquestrador/main.py > /tmp/orquestrador.log 2>&1 &
```

Aguarde ~10 segundos (o orquestrador carrega os modelos YOLO) e confirme que a porta 8765 está LISTENING.

Se a porta 8765 **não aparecer**, leia o log:
```bash
tail -30 /tmp/orquestrador.log
```

Causas comuns:
- `OSError: [Errno 10048]` → porta ainda ocupada; repetir o passo 1 via PowerShell com o novo PID
- Câmeras RTSP inacessíveis → normal se as câmeras físicas estiverem desligadas/fora da rede
- Modelo `.pt` não encontrado → arquivo ausente em `orquestrador/`

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
- **`taskkill /F` via bash é não-confiável no Windows** — sempre usar `Stop-Process` do PowerShell para garantir que o processo morreu antes de subir o novo. Verificar sempre com `netstat` que a porta está livre.
