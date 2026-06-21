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

  await db.exec(`
    CREATE TABLE IF NOT EXISTS zonas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      pontos TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  console.log("Banco de dados inicializado com sucesso");
}