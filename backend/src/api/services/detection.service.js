import Detection from "../models/detection.model.js";
import {
  saveDetection,
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay
} from "../repositories/detection.repository.js";
import { base64ToImage, normalizeBrasiliaTimestamp } from "../utils/convert.js";
import { createFolderByTimestamp } from "../utils/folder.js";

<<<<<<< Updated upstream
export async function createDetection(data) 
=======
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


export function processRawLabel(rawLabel)
{
  if (/^zona[_\s]+perigo$/i.test(stripAccents(rawLabel.trim())))
  {
    return { label: "Zona de Risco", epi_ausente: null, reba_nivel: null };
  }

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

// Um INCIDENTE confirmado pelo orquestrador chega como um único POST, com `label` composto
// ("CAPACETE - AUSENTE, zona_perigo") e uma imagem. Aqui ele é gravado como UMA LINHA POR CAUSA
// (necessário para a análise por label: epi_ausente, reba_nivel...), todas compartilhando o mesmo
// timestamp e os mesmos arquivos de imagem. Portanto: linha = causa; incidente = conjunto de
// linhas com o mesmo `img_path` (é assim que a página de Incidentes volta a mostrar 1 cartão por
// incidente). O retorno é a lista de linhas gravadas.
export async function createDetection(data)
>>>>>>> Stashed changes
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

  // Imagem da câmera lateral (2ª câmera da mesma unidade) — só existe quando a unidade tem dupla câmera
  const imagePathLateral = detection.img_Frame_lateral
    ? await base64ToImage(detection.img_Frame_lateral, folderPath)
    : null;

  detection.img_path = imagePath;
  detection.img_path_lateral = imagePathLateral;
  detection.timestamp = normalizeBrasiliaTimestamp(detection.timestamp);

  await saveDetection(detection);

<<<<<<< Updated upstream
  return detection;
=======
    await saveDetection(detection);
    detections.push(detection);
  }

  return detections;
>>>>>>> Stashed changes
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