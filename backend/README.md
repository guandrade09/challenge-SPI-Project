# Backend

Este diretório contém o backend do projeto, composto por duas partes principais:

- `src/api/`: API REST em Express para autenticação e registro de detecções
- `src/services/`: serviço de monitoramento em tempo real que detecta novas entradas no banco de dados e as envia em tempo real

## Estrutura

- `src/api/app.js` — configuração do Express e rotas
- `src/api/server.js` — servidor com cluster e inicialização do banco
- `src/api/config/database.js` — criação e inicialização do banco SQLite
- `src/api/utils/connection.js` — conexão com SQLite
- `src/api/routes/` — rotas de autenticação e detecção
- `src/api/controllers/` — lógica de requisições
- `src/api/services/` — regras de negócio e persistência de detecções
- `src/services/realtime-service.js` — serviço polling para envio em tempo real
- `src/services/README.md` — documentação específica do serviço realtime

## Dependências principais

A API usa as dependências listadas em `src/api/package.json`:

- `express`
- `sqlite`
- `sqlite3`
- `bcrypt`
- `jsonwebtoken`
- `nodemon` (desenvolvimento)

## Como executar

### 1. API REST

No terminal, a partir da raiz do projeto:

```bash
cd backend/src/api
npm install
node server.js
```

Ou, se preferir, use:

```bash
cd backend/src/api
npm run dev
```

A API escuta por padrão na porta `3000`.

### 2. Serviço realtime

Para iniciar o serviço de detecção em tempo real, execute a partir da raiz do projeto:

```bash
node -e "import('./backend/src/services/realtime-service.js').then(m => m.default.start()).catch(console.error)"
```

Esse serviço verifica novo registros a cada `150ms` e imprime no console a `label` das detecções.

### 3. Testando juntos

1. Inicie a API em um terminal
2. Inicie o serviço realtime em outro terminal
3. Faça requisições de criação de detecções na API
4. Verifique a saída do serviço realtime para receber as labels em tempo quase real

## Endpoints principais

### Autenticação

- `POST /api/user/register`
- `POST /api/user/login`

### Detecções

- `POST /api/detections`
- `GET /api/detections`
- `GET /api/detections/:label`
- `GET /api/detections/:timestamp`

## Observações

- O banco SQLite é criado em `backend/src/api/config/database.sqlite`
- O serviço realtime depende do mesmo banco para monitorar novas inserções
- O arquivo `backend/src/services/README.md` contém a documentação detalhada do serviço realtime
