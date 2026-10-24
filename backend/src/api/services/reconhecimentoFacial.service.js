import ReconhecimentoFacial from '../models/reconhecimentoFacial.model.js';
import {
  saveReconhecimento,
  getAllReconhecimentos,
  getReconhecimentosByFuncionario,
} from '../repositories/reconhecimentoFacial.repository.js';
import { AppError } from '../utils/appError.js';
import { base64ToImage, normalizeBrasiliaTimestamp } from '../utils/convert.js';
import { createFolderByTimestamp } from '../utils/folder.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECOGNITION_UPLOAD_DIR = path.resolve(__dirname, '../uploads/reconhecimentos');

// Reportado pelo orquestrador (ml_facial) a cada rosto confirmado (mesmo esquema de
// debounce por N frames usado em EPI/ergonomia/zona — ver orquestrador/main.py).
export async function createReconhecimento(data) {
  if (!data?.timestamp || (data.confidence === undefined || data.confidence === null)) {
    throw new AppError('Dados inválidos', 400);
  }

  const timestamp = normalizeBrasiliaTimestamp(data.timestamp);

  let img_path = null;
  if (data.img_Frame) {
    const folderPath = await createFolderByTimestamp(timestamp, RECOGNITION_UPLOAD_DIR);
    img_path = await base64ToImage(data.img_Frame, folderPath);
  }

  const reconhecimento = new ReconhecimentoFacial({ ...data, timestamp, img_path });
  return await saveReconhecimento(reconhecimento);
}

export async function listReconhecimentos(limit) {
  return await getAllReconhecimentos(limit);
}

export async function listReconhecimentosPorFuncionario(funcionarioId) {
  return await getReconhecimentosByFuncionario(funcionarioId);
}
