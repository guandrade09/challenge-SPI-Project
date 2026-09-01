import { connect } from "../utils/connection.js";

export async function saveZona(zona) {
  const db = await connect();
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO zonas (camera_id, nome, pontos, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(camera_id) DO UPDATE SET
       nome       = excluded.nome,
       pontos     = excluded.pontos,
       updated_at = excluded.updated_at`,
    [zona.camera_id, zona.nome, zona.pontos, now]
  );
}

export async function findZona(camera_id) {
  const db = await connect();
  const row = await db.get(
    `SELECT camera_id, nome, pontos, updated_at FROM zonas WHERE camera_id = ?`,
    [camera_id]
  );
  if (!row) return null;
  return { ...row, pontos: JSON.parse(row.pontos) };
}

export async function deleteZona(camera_id) {
  const db = await connect();
  const result = await db.run(
    `DELETE FROM zonas WHERE camera_id = ?`,
    [camera_id]
  );
  return result.changes > 0;
}
