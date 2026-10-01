import { connect, openConnection } from "../utils/connection.js";
import { AppError } from "../utils/appError.js";

const SELECT_COLUMNS = `
  id, timestamp, label, confidence, img_path, source, camera_id, setor,
  img_path_lateral, details, epi_ausente, criticidade, reba_nivel
`;

export async function saveDetection(detection)
{
  const db = await connect();

  const query = `
    INSERT INTO detections (timestamp, label, confidence, img_path, source, camera_id, setor, img_path_lateral, details, epi_ausente, criticidade, reba_nivel)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.run(query, [
    detection.timestamp,
    detection.label,
    detection.confidence,
    detection.img_path,
    detection.source ?? null,
    detection.camera_id ?? null,
    detection.setor ?? null,
    detection.img_path_lateral ?? null,
    detection.details ? JSON.stringify(detection.details) : null,
    detection.epi_ausente === null || detection.epi_ausente === undefined
      ? null
      : Number(detection.epi_ausente),
    detection.criticidade ?? null,
    detection.reba_nivel ?? null,
  ]);
}

export async function getAllDetections()
{
  const db = await connect();

  const rows = await db.all(`
    SELECT ${SELECT_COLUMNS}
    FROM detections
  `);
  return rows.map(_parseDetails);
}

export async function getDetectionsByLabel(label)
{
  const db = await connect();

  const rows = await db.all(`
    SELECT ${SELECT_COLUMNS}
    FROM detections
    WHERE TRIM(LOWER(label)) = TRIM(LOWER(?))
  `, [label]);
  return rows.map(_parseDetails);
}

export async function getDetectionsByDay(start, end)
{
  const db = await connect();

  const rows = await db.all(`
    SELECT ${SELECT_COLUMNS}
    FROM detections
    WHERE timestamp >= ? AND timestamp < ?
  `, [start, end]);
  return rows.map(_parseDetails);
}

export async function getSpecificDetections(label, start, end)
{
  const db = await connect();

  const rows = await db.all(`
    SELECT ${SELECT_COLUMNS}
    FROM detections
    WHERE timestamp >= ? AND timestamp < ? AND TRIM(LOWER(label)) = TRIM(LOWER(?))
  `, [start, end, label]);
  return rows.map(_parseDetails);
}

function _parseDetails(row) {
  if (row.details) {
    try { row.details = JSON.parse(row.details); } catch { /* mantém string se inválido */ }
  }
  return row;
}

// Recebe um ID representante por card e remove todas as linhas que compõem
// cada incidente. A conexão separada impede intercalamento com outras consultas.
export async function deleteIncidentGroups(ids, providedDb = null) {
  const db = providedDb || await openConnection();
  let transactionOpen = false;
  try {
    await db.exec("BEGIN IMMEDIATE");
    transactionOpen = true;
    const groups = new Map();
    for (const id of [...new Set(ids)]) {
      const row = await db.get(
        "SELECT id, img_path, timestamp, camera_id, label FROM detections WHERE id = ?",
        id,
      );
      if (!row) throw new AppError(`Incidente ${id} não encontrado.`, 404);
      const key = row.img_path
        ? `img:${row.img_path}|${row.timestamp}|${row.camera_id ?? ''}`
        : `row:${row.timestamp}|${row.camera_id ?? ''}|${row.label}`;
      groups.set(key, row);
    }

    const candidatePaths = new Set();
    let deletedRows = 0;
    for (const row of groups.values()) {
      const where = row.img_path
        ? "img_path = ? AND timestamp = ? AND camera_id IS ?"
        : "img_path IS NULL AND timestamp = ? AND camera_id IS ? AND label = ?";
      const params = row.img_path
        ? [row.img_path, row.timestamp, row.camera_id]
        : [row.timestamp, row.camera_id, row.label];
      const rows = await db.all(
        `SELECT img_path, img_path_lateral FROM detections WHERE ${where}`,
        params,
      );
      for (const item of rows) {
        if (item.img_path) candidatePaths.add(item.img_path);
        if (item.img_path_lateral) candidatePaths.add(item.img_path_lateral);
      }
      const result = await db.run(`DELETE FROM detections WHERE ${where}`, params);
      deletedRows += result.changes;
    }

    const orphanPaths = [];
    for (const filePath of candidatePaths) {
      const reference = await db.get(
        "SELECT 1 FROM detections WHERE img_path = ? OR img_path_lateral = ? LIMIT 1",
        filePath,
        filePath,
      );
      if (!reference) orphanPaths.push(filePath);
    }
    await db.exec("COMMIT");
    transactionOpen = false;
    return { deletedRows, deletedIncidents: groups.size, orphanPaths };
  } catch (error) {
    if (transactionOpen) await db.exec("ROLLBACK");
    throw error;
  } finally {
    if (!providedDb) await db.close();
  }
}
