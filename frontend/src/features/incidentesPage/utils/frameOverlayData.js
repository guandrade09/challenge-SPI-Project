import { KP_CONF_THRESHOLD } from './skeletonUtils.js';

const validBox = (bbox) => Array.isArray(bbox) && bbox.length === 4 && bbox.every(Number.isFinite)
  && bbox[2] > bbox[0] && bbox[3] > bbox[1];

const list = (value) => Array.isArray(value) ? value : [];

export function getIncidentFrameMetadata(details, source) {
  return Object.entries(details?.frames || {}).find(([key, frame]) => (frame?.source || key) === source)?.[1];
}

export function getIncidentCameraDetails(details, source, { hasLateralFrame = false } = {}) {
  const frame = getIncidentFrameMetadata(details, source);
  const hasMultipleFrames = hasLateralFrame || Object.keys(details?.frames || {}).length > 1;
  const matchesCamera = (item, legacySource) => {
    if (!item) return false;
    if (item.camera_id != null && frame?.camera_id != null && String(item.camera_id) !== String(frame.camera_id)) return false;
    if (item.source) return item.source === source;
    if (item.camera_id != null) {
      return frame?.camera_id != null && String(item.camera_id) === String(frame.camera_id);
    }
    return legacySource === source;
  };
  const legacySource = hasMultipleFrames ? null : (details?.image_source || source);
  const epi = list(details?.epi).filter((item) => matchesCamera(item, legacySource));
  // O tracking por vista mantém o score e as coordenadas da mesma observação.
  // A lista agregada de ergonomia pode ter combinado pessoas das duas câmeras.
  const tracking = details?.tracking?.[source];
  const ergonomia = Array.isArray(tracking) ? tracking : list(details?.ergonomia).filter(
    (person) => matchesCamera(person, details?.ergonomia_source || (hasMultipleFrames ? 'lateral' : legacySource)),
  );
  const zona = list(details?.zona).filter((item) => matchesCamera(item, legacySource));
  const analysisErrors = Object.values(frame?.analysis_errors || {}).filter((message) => typeof message === 'string');
  return { epi, ergonomia, zona, cameraId: frame?.camera_id ?? null, analysisErrors };
}

export function getUnassignedCameraDetails(details, { hasLateralFrame = false } = {}) {
  if (!hasLateralFrame && Object.keys(details?.frames || {}).length <= 1) return { epi: [], zona: [] };
  const cameraIds = Object.values(details?.frames || {}).map((frame) => String(frame?.camera_id));
  const unassigned = (item) => item && !item.source && (item.camera_id == null || !cameraIds.includes(String(item.camera_id)));
  return { epi: list(details?.epi).filter(unassigned), zona: list(details?.zona).filter(unassigned) };
}

export function getFrameOverlayData(details, source, { hasLateralFrame = false } = {}) {
  const camera = getIncidentCameraDetails(details, source, { hasLateralFrame });
  const epi = camera.epi.filter((item) => validBox(item?.bbox));
  const reba = camera.ergonomia.filter((person) => validBox(person?.bbox) ||
    (Array.isArray(person?.keypoints) && person.keypoints.length >= 17 && person.keypoints.some((point) =>
      Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[2] >= KP_CONF_THRESHOLD)));
  return { epi, reba };
}
