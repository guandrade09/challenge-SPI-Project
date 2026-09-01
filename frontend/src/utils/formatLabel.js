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
  baixo:        'Baixo',
  medio:        'Médio',
  médio:        'Médio',
  alto:         'Alto',
  muito_alto:   'Muito Alto',
  desconhecido: 'Desconhecido',
};

/**
 * Converte qualquer texto para Capitalize (primeira letra de cada palavra maiúscula).
 * Ignora e preserva siglas e palavras entre parênteses totalmente em maiúsculas (ex: "(REBA 5)", "OK").
 */
export function capitalizeWords(text = '') {
  if (!text) return '';
  return text.replace(/(?:^|\s|-|_)\S+/g, (word) => {
    // Se a palavra estiver entre parênteses ou for totalmente maiúscula/número, mantém o formato original
    if (/^\(?[A-Z0-9-]+\)?$/.test(word.trim())) {
      return word;
    }
    const cleanWord = word.toLowerCase();
    return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
  });
}

// "ergonomia_reba_médio_5" → "Risco Ergonômico Médio (REBA 5)"
function formatRebaLabel(raw) {
  const m = raw.match(/^ergonomia_reba_(.+?)_(\d+)$/i);
  if (!m) return raw;
  const nivel = REBA_NIVEL_PT[m[1].toLowerCase()] ?? m[1];
  return `Risco Ergonômico ${nivel} (REBA ${m[2]})`;
}

export function formatTs(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

/**
 * Formata um único label bruto (EPI ou ergonomia) em texto legível e em Capitalize.
 * Ex: "CAPACETE - AUSENTE" → "Sem Capacete"
 *     "ergonomia_reba_alto_9" → "Risco Ergonômico Alto (REBA 9)"
 *     "usuario sem luva de protecao" → "Usuario Sem Luva De Protecao"
 */
export function formatLabel(raw = '') {
  if (!raw) return '';
  const key = raw.trim().toUpperCase();
  
  let result = raw;
  if (EPI_LABEL_PT[key]) {
    result = EPI_LABEL_PT[key];
  } else if (raw.toLowerCase().startsWith('ergonomia_reba_')) {
    result = formatRebaLabel(raw);
  }

  // Aplica o Capitalize para garantir padrão estético
  return capitalizeWords(result);
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


export const formatDetection = (d) => {
  const icon = RISK_LABELS.has(d.label) ? '⚠' : '✓';
  return `${icon} ${formatLabel(d.label)} — ${(d.confidence * 100).toFixed(0)}%`;
};