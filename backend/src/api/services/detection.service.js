import Detection from "../models/detection.model.js";
import {
  saveDetection,
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay
} from "../repositories/detection.repository.js";
import {findOnedriveAccessToken} from "../repositories/auth.repository.js";
import { base64ToImage, normalizeBrasiliaTimestamp } from "../utils/convert.js";
import {
  createFolderByTimestamp,
  createOneDriveFolderByTimestamp,
  uploadBase64ImageToOneDrive,
} from "../utils/folder.js";

export async function createDetection(data) 
{
  const timestamp = normalizeBrasiliaTimestamp(new Date().toISOString());
  const detection = new Detection({ ...data, timestamp });

  if (!detection.label || !detection.confidence ||
      !detection.img_Frame || !detection.timestamp) 
  {
      throw new Error("Dados inválidos");
  }

  const folderPath = await createFolderByTimestamp(detection.timestamp);
  const imagePath = await base64ToImage(detection.img_Frame, folderPath);

  detection.img_path = imagePath;
  detection.timestamp = normalizeBrasiliaTimestamp(detection.timestamp);

  await saveDetection(detection);

  // const onedriveToken = await findOnedriveAccessToken();

  // if (onedriveToken) {
  //     const remoteFolder = await createOneDriveFolderByTimestamp(
  //         detection.timestamp,
  //         onedriveToken,
  //         "detections"
  //     );

  //     await uploadBase64ImageToOneDrive(
  //         detection.img_Frame,
  //         onedriveToken,
  //         remoteFolder,
  //         `frame_${Date.now()}.jpg`
  //     );
  // }

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