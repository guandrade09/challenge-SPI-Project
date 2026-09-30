import { connect } from '../utils/connection.js';
import Funcionario from '../models/funcionario.model.js';

const SELECT_COLUMNS = `
  id, nome, matricula, setor, cargo, foto_path, face_encoding, status, created_at, updated_at
`;

export async function saveFuncionario(funcionario) {
  const db = await connect();

  const now = new Date().toISOString();
  const created_at = funcionario.created_at || now;
  const updated_at = funcionario.updated_at || now;

  const result = await db.run(
    `INSERT INTO funcionarios (nome, matricula, setor, cargo, foto_path, face_encoding, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      funcionario.nome,
      funcionario.matricula,
      funcionario.setor,
      funcionario.cargo,
      funcionario.foto_path,
      funcionario.face_encoding,
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
  return rows.map((row) => new Funcionario(row));
}

export async function getFuncionarioById(id) {
  const db = await connect();
  const row = await db.get(`SELECT ${SELECT_COLUMNS} FROM funcionarios WHERE id = ?`, [id]);
  return row ? new Funcionario(row) : null;
}

export async function updateFuncionario(id, funcionario) {
  const db = await connect();
  const updated_at = new Date().toISOString();

  await db.run(
    `UPDATE funcionarios
     SET nome = ?, matricula = ?, setor = ?, cargo = ?, foto_path = ?, face_encoding = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [
      funcionario.nome,
      funcionario.matricula,
      funcionario.setor,
      funcionario.cargo,
      funcionario.foto_path,
      funcionario.face_encoding,
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
