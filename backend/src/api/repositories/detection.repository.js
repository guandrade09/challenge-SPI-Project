import { connect } from "../utils/connection.js";

export async function saveDetection(detection) 
{
  const db = await connect();

  const query = `
    INSERT INTO detections (timestamp, label, confidence, img_path)
    VALUES (?, ?, ?, ?)
  `;

  await db.run(query, [
    detection.timestamp,
    detection.label,
    detection.confidence,
    detection.img_path
  ]);
}

export async function getAllDetections() 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path 
    FROM detections
  `);
}

export async function getDetectionsByLabel(label) 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path
    FROM detections
    WHERE TRIM(LOWER(label)) = TRIM(LOWER(?))
  `, [label]);
}

export async function getDetectionsByDay(start, end) 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path
    FROM detections
    WHERE timestamp >= ? AND timestamp < ?
  `, [start, end]);
}

export async function getSpecificDetections(label,start, end) 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, label, confidence, img_path
    FROM detections
    WHERE timestamp >= ? AND timestamp < ? AND TRIM(LOWER(label)) = TRIM(LOWER(?))
  `, [start, end, label]);
}