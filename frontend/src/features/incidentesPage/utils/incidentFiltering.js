const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const epiName = (value) => normalize(value)
  .replace(/^zona_epi_ausente_/, '')
  .replace(/(?:\s*[-_]\s*|\s+)(ausente|errado|presente|correto)$/i, '')
  .replace(/_/g, ' ')
  .trim();

export function getIncidentEpis(incident) {
  const names = new Set();
  for (const epi of incident.details?.epi || []) {
    const name = epiName(epi.label);
    if (name) names.add(name);
  }
  for (const label of String(incident.label || '').split(',')) {
    if (/ergonomia|zona|queda/i.test(label)) continue;
    const name = epiName(label);
    if (name) names.add(name);
  }
  return names;
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
      label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    })),
    { key: 'alert:segura', type: 'alert', value: 'segura', label: 'Segura' },
    { key: 'alert:atencao', type: 'alert', value: 'atencao', label: 'Atenção' },
    { key: 'alert:critica', type: 'alert', value: 'critica', label: 'Crítica' },
  ];
}

export function filterIncidents(incidents, activeFilters, source, onlyAlerts, camera = '') {
  const epiValues = activeFilters.filter((item) => item.type === 'epi').map((item) => item.value);
  const alertValues = activeFilters.filter((item) => item.type === 'alert').map((item) => item.value);
  return incidents.filter((incident) => {
    if (source && incident.source !== source) return false;
    if (camera && incident.camera_id !== camera) return false;
    if (onlyAlerts && !(
      incident.details?.zona?.some((item) => item.invadiu) ||
      incident.details?.ergonomia?.some((item) => item.queda) ||
      incident.details?.epi?.some((item) => normalize(item.label).includes('ausente'))
    )) return false;
    if (epiValues.length && !epiValues.some((value) => getIncidentEpis(incident).has(value))) return false;
    if (alertValues.length && !alertValues.includes(getAlertState(incident))) return false;
    return true;
  });
}
