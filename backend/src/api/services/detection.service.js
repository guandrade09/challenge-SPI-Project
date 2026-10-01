import Detection from "../models/detection.model.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { AppError } from "../utils/appError.js";
import {
  saveDetection,
  getAllDetections,
  getDetectionsByLabel,
  getDetectionsByDay,
  deleteIncidentGroups,
} from "../repositories/detection.repository.js";
import { base64ToImage, normalizeBrasiliaTimestamp } from "../utils/convert.js";
import { createFolderByTimestamp } from "../utils/folder.js";

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

const uploadsRoot = fileURLToPath(new URL("../uploads/", import.meta.url));

function isInsideUploads(filePath, realRoot) {
  const relative = path.relative(realRoot, filePath);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function removeOrphanFrames(paths, root = uploadsRoot) {
  let filesDeleted = 0;
  let filesNotRemoved = 0;
  const realRoot = await fs.realpath(root).catch(() => null);
  for (const filePath of paths) {
    if (!realRoot || !path.isAbsolute(filePath)) {
      filesNotRemoved += 1;
      continue;
    }
    try {
      const realFile = await fs.realpath(filePath);
      if (!isInsideUploads(realFile, realRoot)) {
        filesNotRemoved += 1;
        continue;
      }
      await fs.unlink(realFile);
      filesDeleted += 1;
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Falha ao remover frame sem referências:", error);
        filesNotRemoved += 1;
      }
    }
  }
  return { filesDeleted, filesNotRemoved };
}

export async function deleteDetections(ids) {
  if (!Array.isArray(ids) || ids.length === 0 ||
      ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new AppError("Informe IDs válidos de incidentes.", 400);
  }
  const result = await deleteIncidentGroups(ids);
  const cleanup = await removeOrphanFrames(result.orphanPaths);
  return {
    deletedRows: result.deletedRows,
    deletedIncidents: result.deletedIncidents,
    ...cleanup,
  };
}
