import { useState, useEffect, useCallback } from 'react';
import analiseService from '../services/analiseService';
import { classifyDetection, isDetectionConfirmed } from '../utils/detectionStatus';
import {
  confusionMatrixData,
  latencyLogs,
  radarData,
} from '../mocks/logsPageMocks/test';

const LABEL_COLORS = [
  '#B59481', '#6366f1', '#71ff5e', '#ef4444', '#f59e0b',
  '#06b6d4', '#a855f7', '#ec4899', '#10b981', '#f97316',
];

// --- Funções de Transformação de Dados ---

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

function buildHourlyData(items) {
  const map = {};
  items.forEach(({ timestamp, confidence }) => {
    if (!timestamp) return;
    const hora = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const conf = parseFloat(confidence);
    if (!map[hora]) map[hora] = { hora, alertas: 0, processamento: 0, totalConf: 0, count: 0 };
    map[hora].processamento += 1;
    if (!isNaN(conf) && conf > 0.8) map[hora].alertas += 1;
    if (!isNaN(conf)) { map[hora].totalConf += conf; map[hora].count += 1; }
  });
  return Object.keys(map)
    .sort()
    .map((hora) => {
      const d = map[hora];
      return {
        hora,
        alertas: d.alertas,
        processamento: d.processamento,
        precisao: d.count > 0 ? Math.round((d.totalConf / d.count) * 100) : 0,
      };
    });
}

function buildConfidenceHistogram(items) {
  const buckets = [
    { range: '0-20%', min: 0, max: 0.2, quantidade: 0 },
    { range: '20-40%', min: 0.2, max: 0.4, quantidade: 0 },
    { range: '40-60%', min: 0.4, max: 0.6, quantidade: 0 },
    { range: '60-80%', min: 0.6, max: 0.8, quantidade: 0 },
    { range: '80-100%', min: 0.8, max: 1.01, quantidade: 0 },
  ];
  items.forEach(({ confidence }) => {
    const c = parseFloat(confidence);
    if (isNaN(c)) return;
    const bucket = buckets.find((b) => c >= b.min && c < b.max);
    if (bucket) bucket.quantidade += 1;
  });
  return buckets.map(({ range, quantidade }) => ({ range, quantidade }));
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

// --- Custom Hook Central ---

export function useAnaliseData(currentThread = 'backend_processor', intervalMs = 15000) {
  const [data, setData] = useState({
    detStats: null,
    logs: [],
    resourceData: [],
    confusionMatrix: confusionMatrixData, // Mapeado via mock por enquanto até o backend fornecer
    latencyLogs: latencyLogs,
    radarData: radarData,
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