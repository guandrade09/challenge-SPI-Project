import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function connect() {
  return open({
    filename: new URL("../config/database.sqlite", import.meta.url).pathname,
    driver: sqlite3.Database,
  });
}