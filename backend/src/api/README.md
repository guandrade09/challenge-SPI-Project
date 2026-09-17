# Detection API

API para gerenciamento de autenticação de usuário e registro de detecções de EPI.

## Visão geral

Esta API é responsável por:
- registrar novos usuários
- autenticar usuários via login
- salvar detecções de itens de proteção individual (EPI)
- consultar detecções por etiqueta ou timestamp
- manter os dados em banco SQLite local

## Estrutura principal

- `app.js` - configura o servidor Express e registra as rotas
- `server.js` - gerencia o cluster de workers e inicializa o banco de dados
- `routes/` - rotas HTTP da API
- `controllers/` - lógica de controle de requisições
- `services/` - regras de negócio e validação
- `repositories/` - acesso ao banco de dados SQLite
- `utils/` - utilitários de conexão e tratamento de erros
- `config/database.js` - inicialização e criação de tabelas SQLite

## Endpoints

Base path: `/api`

### Autenticação

- `POST /api/user/register`
  - Registra um novo usuário
  - Body JSON:
    - `name` (string)
    - `email` (string)
    - `password` (string)

- `POST /api/user/login`
  - Autentica um usuário e retorna um token JWT
  - Body JSON:
    - `email` (string)
    - `password` (string)

### Detecções

- `POST /api/detections`
  - Cria uma nova detecção
  - Body JSON esperado inclui campos como:
    - `timestamp`
    - `label`
    - `confidence`
    - `img_Frame`

- `GET /api/detections`
  - Retorna todas as detecções

- `GET /api/detections/:label`
  - Retorna detecções filtradas por `label`

- `GET /api/detections/:timestamp`
  - Retorna detecções por dia do timestamp

## Como executar

1. Abra o terminal em `backend/src/api`
2. Instale as dependências:

```bash
npm install
```

3. Inicie em modo desenvolvimento:

```bash
npm run dev
```

4. Ou inicie em produção:

```bash
npm start
```

A API escuta na porta `3000` por padrão.

## Observações

- O banco SQLite é criado automaticamente em `backend/src/config/database.sqlite`
- O servidor usa `cluster` para criar workers e tolerar falhas de processo
- `bcrypt` é usado para hashing de senhas
- `jsonwebtoken` é usado para gerar tokens JWT

## Dependências principais

- `express`
- `sqlite`
- `sqlite3`
- `bcrypt`
- `jsonwebtoken`
- `nodemon` (desenvolvimento)
