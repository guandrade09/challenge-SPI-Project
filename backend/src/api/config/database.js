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
  
  // await db.run("INSERT INTO onedrives (client_id, tenant_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?)", [
  //   ONEDRIVE_CLIENT_ID,
  //   ONEDRIVE_CLIENT_ID,
  //   ONEDRIVE_CLIENT_ID,
  //   ONEDRIVE_TENANT_ID,
  //   ONEDRIVE_ACCESS_TOKEN,
  //   ONEDRIVE_REFRESH_TOKEN,
  //   ONEDRIVE_EXPIRES_AT
  // ]);
  
  console.log("Banco de dados inicializado com sucesso");
}