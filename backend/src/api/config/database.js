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
      img_frame TEXT
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
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  return db;
}

export async function clearChatHistory() {
  const db = await connect();
  
  await db.exec("DELETE FROM chat_messages;");
  await db.exec("DELETE FROM chat_conversations;");
  
  console.log("✓ Histórico de mensagens e conversas foi limpo com sucesso");
}