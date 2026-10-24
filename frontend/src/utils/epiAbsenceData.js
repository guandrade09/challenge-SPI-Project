import { DETECTION_CONFIG } from '../enums/enums.js';

export const EPI_ABSENCE_OPTIONS = DETECTION_CONFIG.filter(({ id }) => id !== 'queda');

const normalizeLabel = (label) => String(label ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

function getAbsentEpis(item) {
  const flag = item.epi_ausente;
  const markedAbsent = flag === true || flag === 1 || flag === '1';
  const markedPresent = flag === false || flag === 0 || flag === '0';
  if (markedPresent) return [];

  // A API atual separa classe e flag; registros antigos podem incluir o status no label.
  // Uma classe repetida no mesmo registro conta apenas uma vez.
  const epis = String(item.label ?? '').split(',').flatMap((label) => {
    const normalized = normalizeLabel(label);
    if (!markedAbsent && !/\bausente\b/.test(normalized.replaceAll('_', ' '))) return [];
    const option = EPI_ABSENCE_OPTIONS.find(({ id }) => (
      normalized === id || normalized.startsWith(`${id} `)
      || normalized.startsWith(`${id}-`) || normalized.startsWith(`${id}_`)
    ));
    return option ? [option.id] : [];
  });
  return [...new Set(epis)];
}

export function buildEpiAbsenceData(items = []) {
  const emptyCounts = () => Object.fromEntries(EPI_ABSENCE_OPTIONS.map(({ id }) => [id, 0]));
  const minutes = new Map();
  const totals = { totalAbsent: 0, byEpi: emptyCounts() };

  for (const item of items) {
    if (!item?.timestamp) continue;
    const date = new Date(item.timestamp);
    if (!Number.isFinite(date.getTime())) continue;
    const absentEpis = getAbsentEpis(item);
    if (absentEpis.length === 0) continue;
    date.setSeconds(0, 0);
    const timestamp = date.toISOString();
    if (!minutes.has(timestamp)) {
      minutes.set(timestamp, { timestamp, totalAbsent: 0, ...emptyCounts() });
    }
    const point = minutes.get(timestamp);
    point.totalAbsent += 1;
    totals.totalAbsent += 1;
    for (const epi of absentEpis) {
      point[epi] += 1;
      totals.byEpi[epi] += 1;
    }
  }

  return {
    data: [...minutes.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    totals,
  };
}
