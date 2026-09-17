import { connect } from "../utils/connection.js";

export async function initDatabase() {
  const db = await connect();

  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA synchronous = NORMAL;");
  await db.exec("PRAGMA busy_timeout = 5000;");
  await db.exec("PRAGMA temp_store = MEMORY;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      label TEXT NOT NULL,
      confidence REAL NOT NULL,
      img_path TEXT,
      img_frame TEXT,
      source TEXT
    );
  `);

  await db.exec(`
    ALTER TABLE detections ADD COLUMN source TEXT;
  `).catch(() => {});

  // camera_id: identifica a UNIDADE de detecção (par de câmeras frontal+lateral do mesmo orquestrador)
  await db.exec(`
    ALTER TABLE detections ADD COLUMN camera_id TEXT;
  `).catch(() => {});

  // img_path_lateral: caminho da imagem da câmera lateral (ergonomia/zona), quando a unidade tem 2ª câmera
  await db.exec(`
    ALTER TABLE detections ADD COLUMN img_path_lateral TEXT;
  `).catch(() => {});

  // details: JSON com todas as detecções individuais confirmadas (epi, ergonomia, zona, status)
  await db.exec(`
    ALTER TABLE detections ADD COLUMN details TEXT;
  `).catch(() => {});

  // setor: agrupamento de câmeras (multi-setor)
  await db.exec(`
    ALTER TABLE detections ADD COLUMN setor TEXT;
  `).catch(() => {});

  // epi_ausente: só se aplica a detecções de EPI (0/1/NULL) — true quando o EPI está faltando
  await db.exec(`
    ALTER TABLE detections ADD COLUMN epi_ausente INTEGER;
  `).catch(() => {});

  // criticidade: status do veredito recebido (ALERTA, ALERTA_CRITICO, ALERTA_MULTIPLO, MONITORANDO)
  await db.exec(`
    ALTER TABLE detections ADD COLUMN criticidade TEXT;
  `).catch(() => {});

  // reba_nivel: só se aplica a detecções de ergonomia, ex: "medio_6"
  await db.exec(`
    ALTER TABLE detections ADD COLUMN reba_nivel TEXT;
  `).catch(() => {});

  await db.exec(`
    CREATE TABLE IF NOT EXISTS zonas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      pontos TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS onedrives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS threadsConsume (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      thread_name TEXT NOT NULL,
      quantity_of_cpu_ind_percentage INTEGER NOT NULL,
      process_loaded INTEGER
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      started_at TEXT NOT NULL,
      day_index INTEGER NOT NULL DEFAULT 1,
      title_is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      timestamp TEXT NOT NULL,
      user_id INTEGER,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      setor TEXT NOT NULL,
      ip TEXT NOT NULL,
      streamUrl TEXT NOT NULL,
      status TEXT NOT NULL,
      epis TEXT,
      papel TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // papel: identifica o papel da câmera na unidade de detecção ("frontal" p/ EPI, "lateral" p/ ergonomia/zona).
  // O orquestrador busca essas duas câmeras em GET /api/cameras pra saber qual stream usar em cada modelo.
  // (já vem na CREATE TABLE acima, mas o ALTER cobre bancos criados antes desse campo existir)
  await db.exec(`
    ALTER TABLE cameras ADD COLUMN papel TEXT;
  `).catch(() => {});

  return db;
}

export async function clearChatHistory() {
  const db = await connect();
  
  await db.exec("DELETE FROM chat_messages;");
  await db.exec("DELETE FROM chat_conversations;");
  
  console.log("✓ Histórico de mensagens e conversas foi limpo com sucesso");
}