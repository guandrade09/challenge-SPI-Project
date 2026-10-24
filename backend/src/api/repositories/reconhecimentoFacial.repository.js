import { connect } from '../utils/connection.js';

const SELECT_COLUMNS = `
  id, funcionario_id, nome_detectado, camera_id, setor, confidence, timestamp, img_path
`;

export async function saveReconhecimento(reconhecimento) {
  const db = await connect();

  const result = await db.run(
    `INSERT INTO reconhecimentos_faciais (funcionario_id, nome_detectado, camera_id, setor, confidence, timestamp, img_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      reconhecimento.funcionario_id,
      reconhecimento.nome_detectado,
      reconhecimento.camera_id,
      reconhecimento.setor,
      reconhecimento.confidence,
      reconhecimento.timestamp,
      reconhecimento.img_path,
    ]
  );

  return { ...reconhecimento, id: result.lastID };
}

export async function getAllReconhecimentos(limit = 200) {
  const db = await connect();
  return await db.all(
    `SELECT ${SELECT_COLUMNS} FROM reconhecimentos_faciais ORDER BY timestamp DESC LIMIT ?`,
    [limit]
  );
}

export async function getReconhecimentosByFuncionario(funcionarioId) {
  const db = await connect();
  return await db.all(
    `SELECT ${SELECT_COLUMNS} FROM reconhecimentos_faciais WHERE funcionario_id = ? ORDER BY timestamp DESC`,
    [funcionarioId]
  );
}
