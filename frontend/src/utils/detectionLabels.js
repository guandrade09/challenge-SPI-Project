const DISPLAY_LABELS = {
  zona_perigo: 'Zona de Risco',
};

export const formatDetectionLabel = (label) => String(label || '')
  .split(',')
  .map((item) => {
    const normalized = item.trim().toLowerCase();
    return DISPLAY_LABELS[normalized] || item.trim();
  })
  .filter(Boolean)
  .join(', ');
