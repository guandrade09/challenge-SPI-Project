import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uma conexão por processo (o cluster tem um processo por worker), reaproveitada por
// todas as consultas — abrir o arquivo a cada query era caro e, como os PRAGMAs são
// por conexão, as conexões avulsas nem tinham busy_timeout (SQLITE_BUSY sob concorrência).
let connectionPromise = null;

async function openConnection() {
  const databasePath = path.resolve(__dirname, "../config/database.sqlite");

  const db = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA synchronous = NORMAL;");
  await db.exec("PRAGMA busy_timeout = 5000;");
  await db.exec("PRAGMA temp_store = MEMORY;");

  return db;
}

export function connect() {
  if (!connectionPromise) {
    connectionPromise = openConnection().catch((err) => {
      connectionPromise = null; // permite nova tentativa na próxima chamada
      throw err;
    });
  }
  return connectionPromise;
}
