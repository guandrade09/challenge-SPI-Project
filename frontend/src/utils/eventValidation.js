import { formatIncidentLabel } from './formatLabel.js';

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function normalizeConfidence(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) return null;
  return number > 1 ? number / 100 : number;
}

export function getValidationAlert(event) {
  const details = event.detectionDetails || {};
  const label = normalize(event.label || event.tipo);
  const zones = Array.isArray(details.zona) ? details.zona : [];
  const ergonomics = Array.isArray(details.ergonomia) ? details.ergonomia : [];

  const criticalAlerts = [];
  if (/queda|fall/.test(label) || ergonomics.some((person) => person.queda === true || person.queda === 1)) criticalAlerts.push('Queda');
  if (/zona[_\s]+(?:de[_\s]+)?(?:risco|perigo)|invasao/.test(label) || zones.some((zone) => zone.invadiu === true || zone.invadiu === 1)) criticalAlerts.push('Invasão em zona de risco');
  if (criticalAlerts.length) return { urgency: 'critica', label: `Alerta crítico — ${criticalAlerts.join(' • ')}` };

  const riskyErgonomics = ergonomics.filter((person) =>
    /medio|medium/.test(normalize(person.reba_level)) ||
    Number(person.reba_score) >= 4);
  if (/ergonomia|ergonomico|reba/.test(label) || riskyErgonomics.length) {
    const highestRisk = [...riskyErgonomics].sort((a, b) => Number(b.reba_score || 0) - Number(a.reba_score || 0))[0];
    const rawLevel = normalize(highestRisk?.reba_level || event.reba_nivel || event.label || event.tipo);
    const score = highestRisk?.reba_score;
    const level = /alto/.test(rawLevel) ? 'alto' : /medio|medium/.test(rawLevel) ? 'médio' : /baixo/.test(rawLevel) ? 'baixo'
      : Number(score) >= 8 ? 'alto' : Number(score) >= 4 ? 'médio' : '';
    const confidence = highestRisk
      ? normalizeConfidence(highestRisk.confianca ?? highestRisk.confidence ?? highestRisk.confianca_deteccao)
      : normalizeConfidence(event.confidence);
    return { urgency: 'alerta', label: `Alerta — Risco ergonômico${level ? ` ${level}` : ''}${score !== undefined && score !== null ? ` (REBA ${score})` : ''}`, ...(confidence !== null ? { confidence } : {}) };
  }

  const confidence = normalizeConfidence(event.confidence);
  const isEpi = /epi|capacete|colete|mascara|oculos|auricular|bota|luva|protetor|cinto|respirador/.test(label);
  if (isEpi) {
    const rawLabel = event.label || event.tipo;
    const flag = event.epi_ausente;
    const epiLabel = /ausente|errado|sem\s/i.test(normalize(rawLabel)) ? rawLabel
      : flag === true || flag === 1 || flag === '1' ? `${rawLabel} - AUSENTE`
      : flag === false || flag === 0 || flag === '0' ? `${rawLabel} - ERRADO` : rawLabel;
    const urgency = confidence !== null && confidence < 0.6 ? 'alerta' : 'epi';
    return { urgency, label: `${urgency === 'alerta' ? 'Alerta' : 'Alerta de EPI'} — ${formatIncidentLabel(epiLabel)}` };
  }

  return { urgency: 'alerta', label: `Alerta — ${event.tipo || event.label || 'Detecção registrada'}` };
}

export function getValidationUrgency(event) {
  return getValidationAlert(event).urgency;
}

export function requiresEventValidation(event) {
  if (event.origem !== 'Detecção') return false;
  const confidence = normalizeConfidence(event.confidence);
  // Quedas e invasões continuam exigindo ação mesmo quando a confiança é alta.
  return (confidence !== null && confidence < 0.8) || getValidationUrgency(event) === 'critica';
}

export function getPendingValidationEvents(events) {
  const order = { critica: 0, alerta: 1, epi: 2 };
  return events.filter((event) => event.status === 'Pendente' && requiresEventValidation(event))
    .sort((a, b) => order[getValidationUrgency(a)] - order[getValidationUrgency(b)]);
}
