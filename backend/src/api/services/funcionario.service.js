import Funcionario, { MAX_FOTOS_FUNCIONARIO } from '../models/funcionario.model.js';
import * as funcionarioRepository from '../repositories/funcionario.repository.js';
import { AppError } from '../utils/appError.js';
import { base64ToImage } from '../utils/convert.js';
import { createFolderByTimestamp } from '../utils/folder.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FACES_UPLOAD_DIR = path.resolve(__dirname, '../uploads/faces');

const BASE64_IMAGE_PREFIX = /^data:image\/\w+;base64,/;

// No cadastro, cada item do array é uma data URL (base64) do formulário — mesmo formato
// que o orquestrador usa pra mandar frames (ver utils/convert.js#base64ToImage). Na
// edição, o formulário reenvia o array inteiro misturando caminhos já salvos (fotos que o
// usuário manteve) com novas fotos em base64 (as que ele acabou de adicionar) — só
// regravamos as que forem base64; o resto já é um caminho válido em disco e fica como está.
// Até MAX_FOTOS_FUNCIONARIO fotos; mais ângulos/condições de luz = embeddings mais robustos.
async function saveFotosIfProvided(fotosInput) {
  if (!Array.isArray(fotosInput) || fotosInput.length === 0) return [];

  const paths = [];
  for (const item of fotosInput.slice(0, MAX_FOTOS_FUNCIONARIO)) {
    if (!item) continue;
    if (BASE64_IMAGE_PREFIX.test(item)) {
      const folderPath = await createFolderByTimestamp(new Date().toISOString(), FACES_UPLOAD_DIR);
      paths.push(await base64ToImage(item, folderPath));
    } else {
      paths.push(item);
    }
  }
  return paths;
}

function assertMaxFotos(fotos) {
  if (Array.isArray(fotos) && fotos.length > MAX_FOTOS_FUNCIONARIO) {
    throw new AppError(`No máximo ${MAX_FOTOS_FUNCIONARIO} fotos por funcionário`, 400);
  }
}

export async function createFuncionario(data) {
  const { nome, fotos } = data ?? {};
  if (!nome || !String(nome).trim()) {
    throw new AppError('Nome é obrigatório', 400);
  }
  assertMaxFotos(fotos);

  const savedFotos = await saveFotosIfProvided(fotos);

  const funcionario = new Funcionario({
    nome: nome.trim(),
    matricula: data.matricula ?? null,
    setor: data.setor ?? null,
    cargo: data.cargo ?? null,
    fotos: savedFotos,
    face_encodings: null, // calculado pelo orquestrador (ml_facial) no próximo ciclo de sincronização
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
  assertMaxFotos(data.fotos);

  const fotosForamEnviadas = Array.isArray(data.fotos);
  const fotos = fotosForamEnviadas ? await saveFotosIfProvided(data.fotos) : existing.fotos;

  // face_encodings chega como array de arrays (do ml_facial) — serializa pra TEXT antes
  // de gravar. Fotos novas invalidam os embeddings anteriores: força null pra o
  // orquestrador recalcular a partir das fotos atuais.
  const face_encodings = fotosForamEnviadas
    ? null
    : data.face_encodings !== undefined
      ? (data.face_encodings === null ? null : JSON.stringify(data.face_encodings))
      : existing.face_encodings;

  const updated = new Funcionario({
    ...existing,
    ...data,
    fotos,
    face_encodings,
  });

  return await funcionarioRepository.updateFuncionario(id, updated);
}

export async function deleteFuncionarioById(id) {
  const existing = await funcionarioRepository.getFuncionarioById(id);
  if (!existing) throw new AppError('Funcionário não encontrado', 404);
  await funcionarioRepository.deleteFuncionario(id);
  return true;
}
