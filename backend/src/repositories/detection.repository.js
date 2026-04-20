import { connect } from "../utils/connection.js";

export async function saveDetection(detection) {
  const db = await connect();

  const query = `
    INSERT INTO detections (timestamp, label, confidence, img_path, img_frame)
    VALUES (?, ?, ?, ?, ?)
  `;

  await db.run(query, [
    detection.timestamp,
    detection.label,
    detection.confidence,
    detection.img_Path,
    detection.img_Frame,
  ]);
}