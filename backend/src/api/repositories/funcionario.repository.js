import { connect } from '../utils/connection.js';
import Funcionario from '../models/funcionario.model.js';

const SELECT_COLUMNS = `
  id, nome, matricula, setor, cargo, fotos, face_encodings, foto_path, face_encoding,
  status, created_at, updated_at
`;

// Compat: cadastros feitos antes do suporte a múltiplas fotos salvaram em foto_path
// (string única). Preferimos "fotos" (array) sempre que ele já tiver dados.
function resolveFotos(row) {
  if (row.fotos) {
    try {
      const parsed = JSON.parse(row.fotos);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* cai no fallback abaixo */ }
  }
  return row.foto_path ? [row.foto_path] : [];
}

// Idem para o embedding: um valor antigo em face_encoding (objeto único) vira um array
// de 1 item, no mesmo formato que face_encodings usa.
function resolveFaceEncodings(row) {
  if (row.face_encodings) return row.face_encodings;
  if (row.face_encoding) {
    try {
      return JSON.stringify([JSON.parse(row.face_encoding)]);
    } catch {
      return null;
    }
  }
  return null;
}

function toFuncionario(row) {
  return new Funcionario({
    ...row,
    fotos: resolveFotos(row),
    face_encodings: resolveFaceEncodings(row),
  });
}

export async function saveFuncionario(funcionario) {
  const db = await connect();

  const now = new Date().toISOString();
  const created_at = funcionario.created_at || now;
  const updated_at = funcionario.updated_at || now;

  const result = await db.run(
    `INSERT INTO funcionarios (nome, matricula, setor, cargo, fotos, face_encodings, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      funcionario.nome,
      funcionario.matricula,
      funcionario.setor,
      funcionario.cargo,
      JSON.stringify(funcionario.fotos || []),
      funcionario.face_encodings,
      funcionario.status,
      created_at,
      updated_at,
    ]
  );

  return new Funcionario({ ...funcionario, id: result.lastID, created_at, updated_at });
}

export async function getAllFuncionarios() {
  const db = await connect();
  const rows = await db.all(`SELECT ${SELECT_COLUMNS} FROM funcionarios ORDER BY nome`);
  return rows.map(toFuncionario);
}

export async function getFuncionarioById(id) {
  const db = await connect();
  const row = await db.get(`SELECT ${SELECT_COLUMNS} FROM funcionarios WHERE id = ?`, [id]);
  return row ? toFuncionario(row) : null;
}

export async function updateFuncionario(id, funcionario) {
  const db = await connect();
  const updated_at = new Date().toISOString();

  await db.run(
    `UPDATE funcionarios
     SET nome = ?, matricula = ?, setor = ?, cargo = ?, fotos = ?, face_encodings = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [
      funcionario.nome,
      funcionario.matricula,
      funcionario.setor,
      funcionario.cargo,
      JSON.stringify(funcionario.fotos || []),
      funcionario.face_encodings,
      funcionario.status,
      updated_at,
      id,
    ]
  );

  return getFuncionarioById(id);
}

export async function deleteFuncionario(id) {
  const db = await connect();
  await db.run('DELETE FROM funcionarios WHERE id = ?', [id]);
}
