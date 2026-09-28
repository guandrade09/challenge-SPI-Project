import { connect } from "../utils/connection.js";

export async function createUser(user) 
{
  const db = await connect();

  const query = `
    INSERT INTO users (timestamp, name, email, password)
    VALUES (?, ?, ?, ?)
  `;

  return await db.run(query, [
    user.timestamp,
    user.name,
    user.email,
    user.password
  ]);
}

export async function findUserByEmailOrName(email, name) 
{
  const db = await connect();

  return await db.get(
    "SELECT * FROM users WHERE email = ? OR name = ?",
    [email, name]
  );
}

export async function findOnedriveAccessToken() 
{
  const db = await connect();

  const token = await db.get(`
    SELECT access_token 
    FROM onedrives 
    WHERE expires_at > datetime('now')
    ORDER BY expires_at DESC
    LIMIT 1
  `);

  if (!token) 
  {
    throw new Error("Nenhum access token válido encontrado");
  }

  return token?.access_token || null;
}