import { connect } from "../utils/connection.js";

const SELECT_COLUMNS = `
  timestamp, label, confidence, img_path, source, camera_id, setor,
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
