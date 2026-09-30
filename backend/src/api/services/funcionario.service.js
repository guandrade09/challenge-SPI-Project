import Funcionario from '../models/funcionario.model.js';
import * as funcionarioRepository from '../repositories/funcionario.repository.js';
import { AppError } from '../utils/appError.js';
import { base64ToImage } from '../utils/convert.js';
import { createFolderByTimestamp } from '../utils/folder.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FACES_UPLOAD_DIR = path.resolve(__dirname, '../uploads/faces');

// A foto vem como data URL (base64) do formulário de cadastro — mesmo formato que o
// orquestrador usa pra mandar frames (ver utils/convert.js#base64ToImage).
async function saveFotoIfProvided(fotoBase64) {
  if (!fotoBase64) return null;
  const folderPath = await createFolderByTimestamp(new Date().toISOString(), FACES_UPLOAD_DIR);
  return await base64ToImage(fotoBase64, folderPath);
}

export async function createFuncionario(data) {
  const { nome, foto } = data ?? {};
  if (!nome || !String(nome).trim()) {
    throw new AppError('Nome é obrigatório', 400);
  }

  const foto_path = await saveFotoIfProvided(foto);

  const funcionario = new Funcionario({
    nome: nome.trim(),
    matricula: data.matricula ?? null,
    setor: data.setor ?? null,
    cargo: data.cargo ?? null,
    foto_path,
    face_encoding: null, // calculado pelo orquestrador (ml_facial) no próximo ciclo de sincronização
    status: data.status,
  });

  return await funcionarioRepository.saveFuncionario(funcionario);
}

export async function listFuncionarios() {
  return await funcionarioRepository.getAllFuncionarios();
}

export async function getFuncionario(id) {
  return await funcionarioRepository.getFuncionarioById(id);
}

export async function updateFuncionarioById(id, data) {
  const existing = await funcionarioRepository.getFuncionarioById(id);
  if (!existing) throw new AppError('Funcionário não encontrado', 404);

  const foto_path = data.foto ? await saveFotoIfProvided(data.foto) : (data.foto_path ?? existing.foto_path);

  // face_encoding chega como array/objeto (do ml_facial) — serializa pra TEXT antes de gravar.
  // Uma foto nova invalida o embedding anterior: força null pra o orquestrador recalcular.
  const face_encoding = data.foto
    ? null
    : data.face_encoding !== undefined
      ? (data.face_encoding === null ? null : JSON.stringify(data.face_encoding))
      : existing.face_encoding;

  const updated = new Funcionario({
    ...existing,
    ...data,
    foto_path,
    face_encoding,
  });

  return await funcionarioRepository.updateFuncionario(id, updated);
}

export async function deleteFuncionarioById(id) {
  const existing = await funcionarioRepository.getFuncionarioById(id);
  if (!existing) throw new AppError('Funcionário não encontrado', 404);
  await funcionarioRepository.deleteFuncionario(id);
  return true;
}
