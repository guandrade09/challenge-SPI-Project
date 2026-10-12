import { formatLabel } from './formatLabel.js';

const LEVELS = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto', muito_alto: 'Muito Alto',
  negligenciavel: 'Negligenciável', desconhecido: 'Desconhecido' };
const LABELS = { zona_perigo: 'Zona de Risco', zona_risco: 'Zona de Risco', zona_de_risco: 'Zona de Risco',
  queda: 'Queda', fall: 'Queda', ergonomia: 'Ergonomia' };
const WORDS = { oculos: 'Óculos', mascara: 'Máscara', protecao: 'Proteção', deteccao: 'Detecção',
  invasao: 'Invasão', medio: 'Médio', critico: 'Crítico', multiplo: 'Múltiplo', nao: 'Não', epi: 'EPI' };
const readableWords = (text) => text.replace(/[_-]+/g, ' ').split(/\s+/).filter(Boolean)
  .map((word) => WORDS[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

export function formatLiveIncidentLabel(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  const text = raw.trim();
  const key = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s-]+/g, '_');
  const reba = key.match(/^(?:ergonomia_)?reba_(.+?)_(\d+(?:\.\d+)?)$/);
  if (reba) return `Reba ${LEVELS[reba[1]] || readableWords(reba[1])} ${reba[2]}`;
  if (LABELS[key]) return LABELS[key];
  if (key.startsWith('zona_epi_ausente_')) return `${readableWords(formatLabel(`${key.slice(17).toUpperCase()} - AUSENTE`))} na Zona`;
  const epi = key.match(/^(.+?)_(ausente|errado|certo|presente)$/);
  if (epi) {
    const label = `${epi[1].replaceAll('_', ' ').toUpperCase()} - ${epi[2].toUpperCase()}`;
    const formatted = formatLabel(label);
    // Classes conhecidas reutilizam a terminologia já usada na página de incidentes.
    if (formatted !== label) return readableWords(formatted);
  }
  return readableWords(text);
}

export function formatLiveVerdictStatus(status) {
  return { MONITORANDO: 'Monitorando', ALERTA: 'Alerta', ALERTA_CRITICO: 'Alerta Crítico',
    ALERTA_MULTIPLO: 'Alerta Múltiplo' }[status] || formatLiveIncidentLabel(status) || 'Monitorando';
}

export function formatLiveIncidentReasons(reasons) {
  return [...new Set((Array.isArray(reasons) ? reasons : []).map(formatLiveIncidentLabel).filter(Boolean))];
}
