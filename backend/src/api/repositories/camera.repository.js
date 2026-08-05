import { connect } from '../utils/connection.js';
import Camera from '../models/camera.model.js';

// Auxiliar seguro para parsear JSON
function parseEpis(episData) {
  if (!episData) return [];
  if (typeof episData === 'object') return episData;
  try {
    return JSON.parse(episData);
  } catch {
    return [];
  }
}

export async function saveCamera(camera) {
  const db = await connect();

  const query = `
    INSERT INTO cameras (nome, setor, ip, streamUrl, status, epis, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const createdAt = camera.createdAt || now;
  const updatedAt = camera.updatedAt || now;

  const result = await db.run(query, [
    camera.nome,
    camera.setor,
    camera.ip,
    camera.streamUrl || `rtsp://${camera.ip}:554/stream`,
    camera.status || 'connecting',
    JSON.stringify(camera.epis || []),
    createdAt,
    updatedAt
  ]);

  // Retorna o objeto completo com o ID recém-gerado pelo SQLite
  return new Camera({
    ...camera,
    id: result.lastID, // Pega o ID gerado pelo banco
    streamUrl: camera.streamUrl || `rtsp://${camera.ip}:554/stream`,
    status: camera.status || 'connecting',
    epis: camera.epis || [],
    createdAt,
    updatedAt
  });
}

export async function getAllCameras() {
  const db = await connect();
  // 🚀 Adicionado 'ip' na query
  const cameras = await db.all("SELECT id, nome, setor, ip, streamUrl, status, epis, createdAt, updatedAt FROM cameras");
  
  return cameras.map(cam => new Camera({
    ...cam,
    epis: parseEpis(cam.epis) // 🚀 Convertendo string de volta para Array
  }));
}

export async function getCameraById(id) {
  const db = await connect();
  const camera = await db.get("SELECT id, nome, setor, ip, streamUrl, status, epis, createdAt, updatedAt FROM cameras WHERE id = ?", [id]);
  
  if (!camera) return null;

  return new Camera({
    ...camera,
    epis: parseEpis(camera.epis) // 🚀 Convertendo string de volta para Array
  });
}

export async function updateCamera(id, camera) {
  const db = await connect();
  const query = `
    UPDATE cameras
    SET nome = ?, setor = ?, ip = ?, streamUrl = ?, status = ?, epis = ?, updatedAt = ?
    WHERE id = ?
  `;

  const updatedAt = new Date().toISOString();

  await db.run(query, [
    camera.nome,
    camera.setor,
    camera.ip,
    camera.streamUrl,
    camera.status,
    JSON.stringify(camera.epis || []),
    updatedAt,
    id
  ]);

  return getCameraById(id);
}

export async function deleteCamera(id) {
  const db = await connect();
  await db.run("DELETE FROM cameras WHERE id = ?", [id]);
}