import { buildHourlyData, buildConfidenceHistogram } from '../utils/detectionChartData';
import { useState, useEffect, useCallback } from 'react';
import analiseService from '../services/analiseService';
import { classifyDetection, isDetectionConfirmed } from '../utils/detectionStatus';
import { formatDetectionLabel } from '../utils/detectionLabels';

const LABEL_COLORS = [
  '#B59481', '#6366f1', '#71ff5e', '#ef4444', '#f59e0b',
  '#06b6d4', '#a855f7', '#ec4899', '#10b981', '#f97316',
];

// --- Funções de Transformação de Dados ---

function buildPizzaData(items) {
  const map = {};
  items.forEach(({ label: rawLabel }) => {
    const label = formatDetectionLabel(rawLabel);
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
    const label = formatDetectionLabel(item.label);
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
      categoria: formatDetectionLabel(d.label),
      confianca: Math.round(parseFloat(d.confidence) * 100),
      importancia: isDetectionConfirmed(d) ? 8 : 20,
    }))
    .slice(-200);
}

// --- Custom Hook Central ---

export function useAnaliseData(currentThread = 'backend_processor', intervalMs = 15000) {
  const [data, setData] = useState({
    detStats: null,
    logs: [],
    resourceData: [],
    confusionMatrix: [],
    latencyLogs: [],
    radarData: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    try {
      const [detectionsRes, logsRes] = await Promise.allSettled([
        analiseService.getDetections(),
        analiseService.getLogs(),
      ]);

      const items = detectionsRes.status === 'fulfilled' ? detectionsRes.value?.data || [] : [];
      const logs = logsRes.status === 'fulfilled' ? logsRes.value || [] : [];

      // Processa métricas agregadas
      const detStats = {
        pizza: buildPizzaData(items),
        bar: buildBarData(items),
        hourly: buildHourlyData(items),
        confidence: buildConfidenceHistogram(items),
        anomaly: buildAnomalyData(items),
        total: items.length,
        raw: items,
      };

      setData((prev) => ({
        ...prev,
        detStats,
        logs,
      }));
    } catch (error) {
      console.error('Erro ao atualizar dados da AnalisePage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchAllData, intervalMs]);

  return { data, loading, refetch: fetchAllData };
}
