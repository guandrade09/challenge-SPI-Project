export function validConfidence(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : null;
}

export function buildHourlyData(items) {
  const map = {};
  items.forEach(({ timestamp, confidence }) => {
    if (!timestamp) return;
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return;
    date.setSeconds(0, 0);
    const hora = date.toISOString();
    const conf = validConfidence(confidence);
    if (!map[hora]) map[hora] = { hora, alertas: 0, processamento: 0, totalConf: 0, count: 0 };
    map[hora].processamento += 1;
    if (conf !== null && conf > 0.8) map[hora].alertas += 1;
    if (conf !== null) { map[hora].totalConf += conf; map[hora].count += 1; }
  });
  return Object.keys(map)
    .sort()
    .map((hora) => {
      const d = map[hora];
      return {
        hora,
        timestamp: hora,
        alertas: d.alertas,
        processamento: d.processamento,
        precisao: d.count > 0 ? Math.round((d.totalConf / d.count) * 100) : 0,
      };
    });
}

export function buildConfidenceHistogram(items) {
  const buckets = [
    { range: '0-20%', min: 0, max: 0.2, quantidade: 0 },
    { range: '20-40%', min: 0.2, max: 0.4, quantidade: 0 },
    { range: '40-60%', min: 0.4, max: 0.6, quantidade: 0 },
    { range: '60-80%', min: 0.6, max: 0.8, quantidade: 0 },
    { range: '80-100%', min: 0.8, max: 1, quantidade: 0 },
  ];
  items.forEach(({ confidence }) => {
    const c = validConfidence(confidence);
    if (c === null) return;
    const bucket = buckets.find((b) => c >= b.min && (c < b.max || (c === 1 && b.max === 1)));
    if (bucket) bucket.quantidade += 1;
  });
  return buckets.map(({ range, quantidade }) => ({ range, quantidade }));
}

