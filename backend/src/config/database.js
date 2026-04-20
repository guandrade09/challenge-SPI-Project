import { connect } from "../utils/connection.js";

export async function initDatabase() {
  const db = await connect();

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