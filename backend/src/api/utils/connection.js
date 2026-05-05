import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function connect() {
  const databasePath = path.resolve(__dirname, "../config/database.sqlite");

  return open({
    filename: databasePath,
    driver: sqlite3.Database,
  });
}