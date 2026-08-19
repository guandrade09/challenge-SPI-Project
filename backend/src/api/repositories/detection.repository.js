import { connect } from "../utils/connection.js";

export async function saveDetection(detection) 
{
  const db = await connect();

  const query = `
    INSERT INTO detections (timestamp, label, confidence, img_path, source, camera_id, img_path_lateral)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await db.run(query, [
    detection.timestamp,
    detection.label,
    detection.confidence,
    detection.img_path,
    detection.source ?? null,
    detection.camera_id ?? null,
    detection.img_path_lateral ?? null
  ]);
}

export async function getAllDetections()
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path, source, camera_id, img_path_lateral
    FROM detections
  `);
}

export async function getDetectionsByLabel(label)
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path, source, camera_id, img_path_lateral
    FROM detections
    WHERE TRIM(LOWER(label)) = TRIM(LOWER(?))
  `, [label]);
}

export async function getDetectionsByDay(start, end)
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path, source, camera_id, img_path_lateral
    FROM detections
    WHERE timestamp >= ? AND timestamp < ?
  `, [start, end]);
}

export async function getSpecificDetections(label,start, end)
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path, source, camera_id, img_path_lateral
    FROM detections
    WHERE timestamp >= ? AND timestamp < ? AND TRIM(LOWER(label)) = TRIM(LOWER(?))
  `, [start, end, label]);
}