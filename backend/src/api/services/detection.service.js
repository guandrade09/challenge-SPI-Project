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

function splitRawLabels(rawLabel)
{
  if (!rawLabel) return [];

  return String(rawLabel)
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

function stripAccents(value)
{
  return value.normalize("NFD").replace(DIACRITICS_REGEX, "");
}

const ERGONOMIA_REGEX = /^ergonomia_reba_(.+)$/i;


function processRawLabel(rawLabel)
{
  const ergonomiaMatch = rawLabel.match(ERGONOMIA_REGEX);
  if (ergonomiaMatch)
  {
    return {
      label: "ERGONOMIA",
      epi_ausente: null,
      reba_nivel: stripAccents(ergonomiaMatch[1].trim()).toLowerCase(),
    };
  }

  if (rawLabel.includes(" - "))
  {
    const [base, status] = rawLabel.split(" - ");
    return {
      label: base.trim(),
      epi_ausente: /ausente/i.test(status ?? ""),
      reba_nivel: null,
    };
  }

  return { label: rawLabel, epi_ausente: null, reba_nivel: null };
}

export async function createDetection(data)
{
  const timestamp = normalizeBrasiliaTimestamp(new Date().toISOString());

  const rawLabels = [...new Set(splitRawLabels(data.label))];
  const criticidade = data.details?.status ?? null;

  if (rawLabels.length === 0 || !data.confidence ||
      !data.img_Frame || !timestamp)
  {
      throw new Error("Dados inválidos");
  }

  const folderPath = await createFolderByTimestamp(timestamp);
  const imagePath = await base64ToImage(data.img_Frame, folderPath);

  const imagePathLateral = data.img_Frame_lateral
    ? await base64ToImage(data.img_Frame_lateral, folderPath)
    : null;

  const detections = [];
  for (const rawLabel of rawLabels)
  {
    const { label, epi_ausente, reba_nivel } = processRawLabel(rawLabel);

    const detection = new Detection({
      ...data,
      label,
      timestamp,
      epi_ausente,
      criticidade,
      reba_nivel,
    });
    detection.img_path = imagePath;
    detection.img_path_lateral = imagePathLateral;

    await saveDetection(detection);
    detections.push(detection);
  }

  // const onedriveToken = await findOnedriveAccessToken();

  // if (onedriveToken) {
  //     const remoteFolder = await createOneDriveFolderByTimestamp(
  //         timestamp,
  //         onedriveToken,
  //         "detections"
  //     );

  //     await uploadBase64ImageToOneDrive(
  //         data.img_Frame,
  //         onedriveToken,
  //         remoteFolder,
  //         `frame_${Date.now()}.jpg`
  //     );
  // }

  return detections;
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