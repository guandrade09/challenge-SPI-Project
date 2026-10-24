import { buildHourlyData, buildConfidenceHistogram } from '../utils/detectionChartData';
import { useState, useEffect, useCallback } from 'react';
import detectionService from '../services/detectionService';
import { classifyDetection, isDetectionConfirmed } from '../utils/detectionStatus';

const LABEL_COLORS = [
  '#B59481', '#6366f1', '#71ff5e', '#ef4444', '#f59e0b',
  '#06b6d4', '#a855f7', '#ec4899', '#10b981', '#f97316',
];

function buildPizzaData(items) {
  const map = {};
  items.forEach(({ label }) => {
    if (!label) return;
    map[label] = (map[label] || 0) + 1;
  });
  return Object.keys(map).map((name, i) => ({
    name,
    value: map[name],
    color: LABEL_COLORS[i % LABEL_COLORS.length],
  }));
}

function buildBarData(items) {
  const map = {};
  items.forEach((item) => {
    const { label } = item;
    if (!label) return;
    if (!map[label]) map[label] = { detectado: 0, naoDetectado: 0 };
    map[label][classifyDetection(item)] += 1;
  });
  return Object.keys(map).map((name) => ({ name, ...map[name] }));
}

function buildAnomalyData(items) {
  return items
    .filter((d) => d.confidence != null && d.label)
    .map((d) => ({
      categoria: d.label,
      confianca: Math.round(parseFloat(d.confidence) * 100),
      importancia: isDetectionConfirmed(d) ? 8 : 20,
    }))
    .slice(-200);
}

export function useDetectionStats(intervalMs = 30000) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const payload = await detectionService.list();
      const items = payload?.data || [];
      setStats({
        pizza: buildPizzaData(items),
        bar: buildBarData(items),
        hourly: buildHourlyData(items),
        confidence: buildConfidenceHistogram(items),
        anomaly: buildAnomalyData(items),
        total: items.length,
        raw: items,
      });
    } catch {
      // mantém dados anteriores
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [fetch, intervalMs]);

  return { stats, loading, refetch: fetch };
}
