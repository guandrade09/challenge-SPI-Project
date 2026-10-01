// Mesma regra usada nos gráficos do frontend (frontend/src/utils/detectionStatus.js)
// e no executor de ferramentas do chat (report-tool-executor.js): só é considerada
// confirmada quando o equipamento não está marcado como ausente e a confiança é
// suficiente. Mantida em um único lugar para os três pontos não divergirem.
export const CONFIDENCE_THRESHOLD = 0.6;

export function isDetectionConfirmed(item) {
  if (!item) return false;

  const epiAusente = item.epi_ausente;
  if (epiAusente === true || epiAusente === 1 || epiAusente === "1") return false;

  const confidence = parseFloat(item.confidence);
  return !isNaN(confidence) && confidence >= CONFIDENCE_THRESHOLD;
}
