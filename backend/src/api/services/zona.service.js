import Zona from "../models/zona.model.js";
import { saveZona, findZona, deleteZona } from "../repositories/zona.repository.js";

export async function upsertZona(data) {
  if (data.areas !== undefined) {
    if (!data.camera_id || !Array.isArray(data.areas) || data.areas.length < 1 || data.areas.length > 4) {
      throw new Error('Informe de 1 a 4 áreas por câmera');
    }
    const ids = new Set();
    for (const area of data.areas) {
      if (!area || !Number.isInteger(area.id) || area.id < 1 || area.id > 4 || ids.has(area.id)
          || typeof area.nome !== 'string' || !area.nome.trim() || area.nome.trim().length > 60
          || !Array.isArray(area.pontos) || area.pontos.length < 3
          || !area.pontos.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) {
        throw new Error('Área inválida: identificador de 1 a 4, nome de até 60 caracteres e pontos válidos são obrigatórios');
      }
      ids.add(area.id);
    }
    data = { ...data, nome: data.areas[0].nome, pontos: data.areas[0].pontos };
  } else if (!data.camera_id || !data.nome || !data.pontos) {
    throw new Error("camera_id, nome e pontos são obrigatórios");
  }
  if (!Array.isArray(data.pontos) || data.pontos.length < 3) {
    throw new Error("pontos deve ser um array com ao menos 3 pontos");
  }
  const zona = new Zona(data);
  await saveZona(zona);
  return { camera_id: zona.camera_id, nome: zona.nome, pontos: data.pontos, ...(data.areas ? { areas: data.areas } : {}) };
}

export async function getZona(camera_id) {
  return await findZona(camera_id);
}

export async function removeZona(camera_id) {
  return await deleteZona(camera_id);
}
