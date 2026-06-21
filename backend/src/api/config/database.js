import { connect } from "../utils/connection.js";

export async function initDatabase() {
  const db = await connect();

  await db.exec("PRAGMA journal_mode = WAL;");
  await db.exec("PRAGMA synchronous = NORMAL;");
  await db.exec("PRAGMA busy_timeout = 5000;");
  await db.exec("PRAGMA temp_store = MEMORY;");

  // Tabela para armazenar detecções
  // id: identificador único
  // timestamp: data e hora da detecção
  // label: rótulo da detecção (ex: "Pessoa", "Carro")
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
  
  // Tabela para armazenar usuários (para autenticação)
  // id: identificador único
  // timestamp: data e hora do registro
  // name: nome do usuário
  // email: email do usuário (deve ser único)
  // password: hash da senha do usuário
 await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // Tabela para armazenar tokens do OneDrive
  // id: identificador único
  // client_id: ID do cliente registrado no Azure
  // tenant_id: ID do locatário registrado no Azure
  // access_token: token de acesso atual para a API do OneDrive
  // refresh_token: token de atualização para obter novos tokens de acesso
  // expires_at: data e hora de expiração do token de acesso
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

  // Tabela para monitorar consumo de threads
  // id: identificador único
  // timestamp: data e hora do registro
  // thread_name: nome da thread (ex: "CameraThread-1")
  // quantity_of_cpu_ind_percentage : quantidade de CPU consumida pela thread no momento do registro
  await db.exec(`
    
    CREATE TABLE IF NOT EXISTS threadsConsume (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      thread_name TEXT NOT NULL,
      quantity_of_cpu_ind_percentage INTERGER NOT NULL, 
      renderization_process INTERGER
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