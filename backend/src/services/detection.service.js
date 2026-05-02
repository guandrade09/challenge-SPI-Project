import Detection from "../models/detection.model.js";
import {
  saveDetection,
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay
} from "../repositories/detection.repository.js";

import { base64ToImage } from "../utils/convert.js";
import { createFolderByTimestamp } from "../utils/folder.js";

export async function createDetection(data) 
{
  const detection = new Detection(data);

  if (!detection.label || !detection.confidence ||
      !detection.img_Frame || !detection.timestamp) 
  {
      throw new Error("Dados inválidos");
  }

  const folderPath = await createFolderByTimestamp(detection.timestamp);
  const imagePath = await base64ToImage(detection.img_Frame, folderPath);

  detection.img_path = imagePath;
  detection.timestamp = new Date(detection.timestamp).toISOString();

  await saveDetection(detection);

  return detection;
}

export async function viewDetection() 
{
  return await getAllDetections();
}

export async function searchDetection(label) 
{
  return await getDetectionsByLabel(label);
}

export async function searchDetectionByDay(day) 
{
  const start = new Date(day);
  const end = new Date(day);
  end.setDate(end.getDate() + 1);

  return await getDetectionsByDay(
    start.toISOString(),
    end.toISOString()
  );
}