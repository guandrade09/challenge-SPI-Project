import Zona from "../models/zona.model.js";
import { saveZona, findZona, deleteZona } from "../repositories/zona.repository.js";

export async function upsertZona(data) {
  if (!data.camera_id || !data.nome || !data.pontos) {
    throw new Error("camera_id, nome e pontos são obrigatórios");
  }
  if (!Array.isArray(data.pontos) || data.pontos.length < 3) {
    throw new Error("pontos deve ser um array com ao menos 3 pontos");
  }
  const zona = new Zona(data);
  await saveZona(zona);
  return { camera_id: zona.camera_id, nome: zona.nome, pontos: data.pontos };
}

export async function getZona(camera_id) {
  return await findZona(camera_id);
}

export async function removeZona(camera_id) {
  return await deleteZona(camera_id);
}
