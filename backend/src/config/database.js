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

  console.log("Banco de dados inicializado com sucesso");
}