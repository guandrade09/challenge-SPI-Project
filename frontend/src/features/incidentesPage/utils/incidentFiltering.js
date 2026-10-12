const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const epiName = (value) => normalize(value)
  .replace(/^zona_epi_ausente_/, '')
  .replace(/(?:\s*[-_]\s*|\s+)(ausente|errado|presente|correto|certo)$/i, '')
  .replace(/_/g, ' ')
  .trim();

export function getIncidentEpis(incident) {
  const names = new Set();
  for (const epi of incident.details?.epi || []) {
    const name = epiName(epi.label);
    if (name) names.add(name);
  }
  for (const label of String(incident.label || '').split(',')) {
    if (/ergonomia|reba|queda|fall/i.test(label) || (/zona/i.test(label) && !/zona_epi_ausente_/i.test(label))) continue;
    const name = epiName(label);
    if (name) names.add(name);
  }
  for (const zone of incident.details?.zona || []) {
    for (const label of zone.epis_ausentes || []) {
      const name = epiName(label);
      if (name) names.add(name);
    }
  }
  return names;
}

export function capitalizeFilterText(value) {
  return String(value || '').replace(/_/g, ' ').toLocaleLowerCase('pt-BR')
    .replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase('pt-BR'));
}

export function getIncidentUrgencies(incident) {
  const values = new Set();
  if (incident.details?.zona?.some((item) => item.invadiu) ||
      /zona[\s_]+(?:de[\s_]+)?(?:risco|perigo)/i.test(incident.label || '')) values.add('zona');
  if (incident.details?.ergonomia?.some((item) => item.queda) ||
      /\b(?:queda|fall)\b/i.test(String(incident.label || '').replace(/_/g, ' '))) values.add('queda');
  return values;
}

export function getErgonomicStates(incident) {
  const states = new Set();
  const classify = (score, level) => {
    if (score !== null && score !== undefined && score !== '' && Number.isFinite(Number(score))) {
      return Number(score) >= 7 ? 'risco' : Number(score) >= 4 ? 'atencao' : 'conformidade';
    }
    const normalized = normalize(level);
    if (/alto|critico|risco/.test(normalized)) return 'risco';
    if (/medio|atencao/.test(normalized)) return 'atencao';
    if (/baixo|negligenciavel|conformidade/.test(normalized)) return 'conformidade';
    return null;
  };
  for (const person of incident.details?.ergonomia || []) {
    if (person.queda) continue;
    const state = classify(person.reba_score, person.reba_level);
    if (state) states.add(state);
  }
  if (!incident.details?.ergonomia?.length) {
    // Compatibilidade com registros antigos que guardam o nível apenas no rótulo/linha.
    const level = String(incident.reba_nivel || '');
    const levelScore = level.match(/_(\d+)$/);
    const state = classify(levelScore?.[1], level);
    if (state && !getIncidentUrgencies(incident).has('queda')) states.add(state);
    for (const label of String(incident.label || '').split(',')) {
      const match = normalize(label).match(/(?:ergonomia_)?reba_(.+?)_(\d+)$/);
      if (match) states.add(classify(match[2], match[1]));
    }
  }
  return states;
}

export function getCameraOptions(incidents, registeredCameras = []) {
  const options = new Map();
  for (const incident of incidents) {
    if (incident.camera_id === null || incident.camera_id === undefined || incident.camera_id === '') continue;
    const id = String(incident.camera_id);
    const camera = registeredCameras.find((item) => String(item.id) === id);
    const name = camera?.nome || incident.camera_nome || incident.camera_name || 'Câmera sem cadastro';
    options.set(id, { value: id, label: `${name} | ${id}` });
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function getAlertState(incident) {
  const status = normalize(incident.criticidade || incident.details?.status).toUpperCase();
  if (status === 'MONITORANDO') return 'segura';
  if (status === 'ALERTA_MULTIPLO' || status === 'ALERTA_CRITICO') return 'critica';
  if (status.startsWith('ALERTA')) return 'atencao';

  // Registros antigos podem não ter criticidade. Usamos os mesmos sinais do card.
  if (incident.details?.zona?.some((item) => item.invadiu) ||
      incident.details?.ergonomia?.some((item) => item.queda || Number(item.reba_score) >= 7)) return 'critica';
  if (incident.details?.epi?.some((item) => normalize(item.label).includes('ausente')) ||
      /ausente|errado/i.test(incident.label || '') ||
      incident.details?.ergonomia?.some((item) => Number(item.reba_score) >= 4)) return 'atencao';
  return 'segura';
}

export function getFilterOptions(incidents) {
  const epis = new Set();
  for (const incident of incidents) {
    for (const name of getIncidentEpis(incident)) epis.add(name);
  }
  return [
    ...[...epis].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((value) => ({
      key: `epi:${value}`,
      type: 'epi',
      value,
      label: ({ oculos: 'Óculos', mascara: 'Máscara' })[value] || capitalizeFilterText(value),
    })),
    { key: 'urgency:zona', type: 'urgency', value: 'zona', label: 'Zona de risco' },
    { key: 'urgency:queda', type: 'urgency', value: 'queda', label: 'Queda' },
    { key: 'ergonomics:conformidade', type: 'ergonomics', value: 'conformidade', label: 'Conformidade' },
    { key: 'ergonomics:atencao', type: 'ergonomics', value: 'atencao', label: 'Atenção' },
    { key: 'ergonomics:risco', type: 'ergonomics', value: 'risco', label: 'Risco' },
  ];
}

export function filterIncidents(incidents, activeFilters, source, onlyAlerts, camera = '', timeRange = {}) {
  const epiValues = activeFilters.filter((item) => item.type === 'epi').map((item) => item.value);
  const urgencyValues = activeFilters.filter((item) => item.type === 'urgency').map((item) => item.value);
  const ergonomicValues = activeFilters.filter((item) => item.type === 'ergonomics').map((item) => item.value);
  const start = timeRange.start ? new Date(timeRange.start).getTime() : null;
  // O campo tem precisão de minutos: inclui todos os segundos do minuto final.
  const end = timeRange.end ? new Date(timeRange.end).getTime() + 59999 : null;
  return incidents.filter((incident) => {
    if (source && incident.source !== source) return false;
    if (camera && String(incident.camera_id) !== String(camera)) return false;
    if (start !== null || end !== null) {
      const timestamp = new Date(incident.timestamp).getTime();
      if (!Number.isFinite(timestamp) || (start !== null && timestamp < start) || (end !== null && timestamp > end)) return false;
    }
    if (onlyAlerts && getAlertState(incident) === 'segura' && !getIncidentUrgencies(incident).size &&
        ![...getErgonomicStates(incident)].some((state) => state !== 'conformidade')) return false;
    if (epiValues.length && !epiValues.some((value) => getIncidentEpis(incident).has(value))) return false;
    if (urgencyValues.length && !urgencyValues.some((value) => getIncidentUrgencies(incident).has(value))) return false;
    if (ergonomicValues.length && !ergonomicValues.some((value) => getErgonomicStates(incident).has(value))) return false;
    return true;
  });
}
