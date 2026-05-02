import { connect } from "../utils/connection.js";
import { base64ToImage } from "../utils/convert.js";
import { createFolderByTimestamp } from "../utils/folder.js";

//#region :: POST DETECTIONS -> Armazena todas deteccoes passadas na base ::
export async function saveDetection(detection) {
  const db = await connect();

  const query = `
    INSERT INTO detections (timestamp, label, confidence, img_path)
    VALUES (?, ?, ?, ?)
  `;

  const isoDate = new Date(detection.timestamp).toISOString();

  const folderPath = await createFolderByTimestamp(detection.timestamp);

  const imagePath = await base64ToImage(detection.img_Frame, folderPath);

  await db.run(query, [
    isoDate,
    detection.label,
    detection.confidence,
    imagePath
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