import { connect } from "../utils/connection.js";

//#region :: POST DETECTIONS -> Armazena todas deteccoes passadas na base ::
export async function saveDetection(detection) {
  const db = await connect();
  
  const query = `
    INSERT INTO detections (timestamp, label, confidence, img_path, img_frame)
    VALUES (?, ?, ?, ?, ?)
  `;

  const isoDate = new Date(detection.timestamp).toISOString();
  
  await db.run(query, [
    isoDate,
    detection.label,
    detection.confidence,
    detection.img_Path,
    detection.img_Frame,
  ]);
}
//#endregion

//#region :: GET ALL DETECTIONS -> Retorna todas as deteccoes armazenadas na base ::
export async function viewAllDetection() {
  const db = await connect();

  const query = `
    SELECT timestamp, label, confidence, img_path, img_frame from detections
  `;

  const rows = await db.all(query);
  return rows;
}
//#endregion

//#region :: GET DETECTIONS BY LABEL -> Retorna apenas a deteccao desejada com base na label ::
export async function viewDetectionByLabel(label) {
  const db = await connect();

  const query = `
    SELECT timestamp, label, confidence, img_path, img_frame from detections
    where TRIM(LOWER(label)) = TRIM(LOWER(?))
  `;

  const rows = await db.all(query, [label]);
  return rows;
}
//#endregion

//#region :: GET DETECTIONS BY DAY -> Retorna apenas a deteccao desejada com base no dia ::
export async function viewDetectionByDay(day) 
{
  const db = await connect();

  const start = new Date(day);
  const end = new Date(day);
  end.setDate(end.getDate() + 1);

  const query = `
    SELECT timestamp, label, confidence, img_path, img_frame
    FROM detections
    WHERE timestamp >= ? AND timestamp < ?
  `;

  const rows = await db.all(query, [
    start.toISOString(),
    end.toISOString()
  ]);

  return rows;
}
//#endregion