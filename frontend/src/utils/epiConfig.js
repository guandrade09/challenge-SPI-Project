export const EPI_KEYS = ['auricular', 'botas', 'capacete', 'colete', 'mascara', 'oculos'];

const EPI_ALIASES = {
  '1': 'capacete',
  '2': 'oculos',
  '3': 'colete',
  '4': 'mascara',
  auricular: 'auricular',
  botas: 'botas',
  capacete: 'capacete',
  colete: 'colete',
  mascara: 'mascara',
  oculos: 'oculos',
};

const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export const normalizeEpiList = (epis) => {
  if (!Array.isArray(epis)) return [];
  const normalized = epis
    .map((item) => {
      const raw = typeof item === 'object' && item !== null
        ? (item.key ?? item.nome ?? item.name ?? item.id)
        : item;
      return EPI_ALIASES[normalizeText(raw)] || null;
    })
    .filter(Boolean);
  return [...new Set(normalized)];
};

export const isMissingEpiDetection = (detection) => {
  const label = String(detection?.label || '').toUpperCase();
  return label.includes('AUSENTE') || label.includes('ERRADO');
};
