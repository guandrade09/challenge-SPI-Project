const EPI_LABEL_PT = {
  'CAPACETE - AUSENTE':  'Sem Capacete',
  'CAPACETE - ERRADO':   'Capacete Errado',
  'CAPACETE - CERTO':    'Capacete OK',
  'COLETE - AUSENTE':    'Sem Colete',
  'COLETE - CERTO':      'Colete OK',
  'MASCARA - AUSENTE':   'Sem Máscara',
  'MASCARA - ERRADO':    'Máscara Errada',
  'MASCARA - CERTO':     'Máscara OK',
  'OCULOS - AUSENTE':    'Sem Óculos',
  'OCULOS - ERRADO':     'Óculos Errado',
  'OCULOS - CERTO':      'Óculos OK',
  'AURICULAR - AUSENTE': 'Sem Auricular',
  'AURICULAR - ERRADO':  'Auricular Errado',
  'AURICULAR - CERTO':   'Auricular OK',
  'BOTAS - AUSENTE':     'Sem Botas',
  'BOTAS - CERTO':       'Botas OK',
};

const REBA_NIVEL_PT = {
  baixo:       'Baixo',
  medio:       'Médio',
  médio:       'Médio',
  alto:        'Alto',
  muito_alto:  'Muito Alto',
  desconhecido:'Desconhecido',
};

// "ergonomia_reba_médio_5" → "Risco Ergonômico Médio (REBA 5)"
function formatRebaLabel(raw) {
  const m = raw.match(/^ergonomia_reba_(.+?)_(\d+)$/i);
  if (!m) return raw;
  const nivel = REBA_NIVEL_PT[m[1].toLowerCase()] ?? m[1];
  return `Risco Ergonômico ${nivel} (REBA ${m[2]})`;
}

/**
 * Formata um único label bruto (EPI ou ergonomia) em texto legível.
 * Ex: "CAPACETE - AUSENTE" → "Sem Capacete"
 *     "ergonomia_reba_alto_9" → "Risco Ergonômico Alto (REBA 9)"
 */
export function formatLabel(raw = '') {
  const key = raw.trim().toUpperCase();
  if (EPI_LABEL_PT[key]) return EPI_LABEL_PT[key];
  if (raw.toLowerCase().startsWith('ergonomia_reba_')) return formatRebaLabel(raw);
  return raw;
}

/**
 * Formata o campo `incident.label` que pode conter vários labels separados por vírgula.
 * Ex: "CAPACETE - AUSENTE, ergonomia_reba_alto_9" → "Sem Capacete • Risco Ergonômico Alto (REBA 9)"
 */
export function formatIncidentLabel(label = '') {
  if (!label) return '—';
  return label
    .split(',')
    .map((part) => formatLabel(part.trim()))
    .join(' • ');
}
