export const RISK_AREA_SLOTS = [
  { id: 1, color: '#f59e0b' }, { id: 2, color: '#38bdf8' },
  { id: 3, color: '#a78bfa' }, { id: 4, color: '#fb7185' },
];

export function normalizeRiskAreas(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [{ id: 1, nome: 'Área 1', box: value }];
}

export function riskAreasFromZone(zone, width, height) {
  if (!zone) return [];
  const areas = zone.areas || (zone.pontos?.length ? [{ id: 1, nome: zone.nome || 'Área 1', pontos: zone.pontos }] : []);
  return areas.map((area) => {
    if (area.box) return { id: area.id, nome: area.nome, box: area.box };
    if (!(width > 0 && height > 0) || !area.pontos?.length) return null;
    const xs = area.pontos.map((p) => p.x), ys = area.pontos.map((p) => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { id: area.id, nome: area.nome, box: { x: x / width * 100, y: y / height * 100,
      width: (Math.max(...xs) - x) / width * 100, height: (Math.max(...ys) - y) / height * 100 } };
  }).filter(Boolean);
}

export function replaceRiskArea(areas, id, nome, box) {
  if (!Number.isInteger(id) || id < 1 || id > 4) throw new Error('Selecione um dos quatro delimitadores.');
  const next = areas.filter((area) => area.id !== id);
  if (box) {
    const name = nome.trim();
    if (!name || name.length > 60) throw new Error('Informe um nome com até 60 caracteres.');
    const { x, y, width, height } = box;
    if (![x, y, width, height].every(Number.isFinite) || width <= 0.5 || height <= 0.5
        || x < 0 || y < 0 || x + width > 100 + 1e-6 || y + height > 100 + 1e-6) {
      throw new Error('Desenhe uma área válida dentro da imagem.');
    }
    next.push({ id, nome: name, box });
  }
  return next.sort((a, b) => a.id - b.id);
}
