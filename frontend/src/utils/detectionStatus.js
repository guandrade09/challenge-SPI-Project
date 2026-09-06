// Regra única de classificação usada em todos os gráficos de "Detectado / Não Detectado".
export const CONFIDENCE_THRESHOLD = 0.6;

function isAusente(epiAusente) {
  return epiAusente === true || epiAusente === 1 || epiAusente === "1";
}

export function isDetectionConfirmed(item) {
  if (!item) return false;
  if (isAusente(item.epi_ausente)) return false;

  const confidence = parseFloat(item.confidence);
  return !isNaN(confidence) && confidence >= CONFIDENCE_THRESHOLD;
}

export function classifyDetection(item) {
  return isDetectionConfirmed(item) ? "detectado" : "naoDetectado";
}
