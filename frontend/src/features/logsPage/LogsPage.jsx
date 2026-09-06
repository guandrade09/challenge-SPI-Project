import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useResourceMetrics } from '../../hooks/useResourceMetrics';
import { RenderColumn } from './RenderColumn';
import { ThreadSelector } from '../../components/shared';
import {
  AreaDetectionChart,
  AnomalyScatterChart,
  DashboardChart,
  DetectionBarChart,
  DetectionComposedChart,
  DetectionLineChart,
  MLConfusionMatrix,
  InferenceLatencyChart,
  OperationalRadar,
  ConfidenceDistribution,
  ResourceMonitor,
} from '../../components/graficos';
import { LogPanel, LogReportModal } from './components/painelLog';
import { logService } from '../../services/logService';
import { useDetectionStats } from '../../hooks/useDetectionStats';
import { getThreadLabel, getThreadMetricsConfig } from '../../utils/threadOptions';
import {
  confusionMatrixData,
  latencyLogs,
  radarData,
} from '../../mocks/logsPageMocks/test';

const DASHBOARD_CONFIG = {
  col1: [['logs']],
  col2: [['area', 'composed'], ['radar', 'latency', 'monitorcpu']],
  col3: [['pizza', 'linha', 'barra'], ['matrix', 'confidence', 'anomaly']],
};

const LogsPage = () => {
  const currentTheme = useUiStore((s) => s.theme); 

  const isPopUpModalOpen = useUiStore((s) => s.isPopUpModalOpen);
  const closePopUpModal  = useUiStore((s) => s.closePopUpModal);
  const reportData       = useUiStore((s) => s.reportData);

  const { stats: detStats } = useDetectionStats(30000);

  const [logs, setLogs] = useState([]);
  const [isLogLoading, setIsLogLoading] = useState(false);
  const logsRef = useRef([]);

  // 1. Estado para controlar qual thread está sendo exibida no card de recursos
  const [currentThread, setCurrentThread] = useState("backend_processor");

  // 2. Hook alimentado pelo estado reativo da thread
  const { data: realTimeResourceData, refetch: refetchResourceMetrics } = useResourceMetrics(currentThread, 15);

  const areLogsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item.timestamp === b[index]?.timestamp && item.message === b[index]?.message);
  };

  const fetchLogs = async () => {
    const showLoading = logsRef.current.length === 0;
    if (showLoading) setIsLogLoading(true);

    try {
      const entries = await logService.listEntries();
      const normalizedLogs = (entries || []).map((entry) => ({
        timestamp: entry.timestamp,
        message: entry.line ?? entry.message ?? entry.logs ?? "",
      }));

      if (!areLogsEqual(logsRef.current, normalizedLogs)) {
        logsRef.current = normalizedLogs;
        setLogs(normalizedLogs);
      }
    } catch (error) {
      console.error("Erro ao buscar logs em tempo real:", error);
      if (logsRef.current.length === 0) {
        setLogs([]);
      }
    } finally {
      if (showLoading) setIsLogLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchResourceMetrics();
    }, 15000);
    return () => clearInterval(interval);
  }, [refetchResourceMetrics]);

   // Componente de botão estilizado para o Header do Card
  const ThreadToggleButton = <ThreadSelector currentThread={currentThread} onChange={setCurrentThread} />;

  const logsMetricsConfig = getThreadMetricsConfig(currentThread);

  const COMPONENT_MAP = {
    logs: { label: "Central de Logs", component: <LogPanel logs={logs} loading={isLogLoading} theme={currentTheme}/> },

    // Coluna 2 — Análise e Monitoramento
    area:       { label: "Análise Composta",        component: <AreaDetectionChart    data={detStats?.hourly ?? []}  theme={currentTheme}    /> },
    composed:   { label: "Análise de Eventos",       component: <DetectionComposedChart data={detStats?.hourly ?? []} theme={currentTheme} /> },
    radar:      { label: "Eficiência Operacional",   component: <OperationalRadar       data={radarData}  theme={currentTheme}   /> },
    latency:    { label: "Latência MCU/CAM",         component: <InferenceLatencyChart  data={latencyLogs} theme={currentTheme}  /> },
    monitorcpu: {
      label: `Recursos (${getThreadLabel(currentThread)})`,
      headerAction: ThreadToggleButton,
      component: <ResourceMonitor data={realTimeResourceData} theme={currentTheme} linesConfig={logsMetricsConfig}/>
    },

    // Coluna 3 — Detecções e ML
    pizza:      { label: "Gráfico de detecções",      component: <DashboardChart        data={detStats?.pizza ?? []} theme={currentTheme}     /> },
    linha:      { label: "Gráfico de alertas",         component: <DetectionLineChart    data={detStats?.hourly ?? []}  theme={currentTheme}    /> },
    barra:      { label: "Detecções por Categoria",    component: <DetectionBarChart     data={detStats?.bar ?? []} theme={currentTheme}  /> },
    matrix:     { label: "Matriz de Confusão",          component: <MLConfusionMatrix     data={confusionMatrixData} theme={currentTheme}/> },
    confidence: { label: "Termômetro de Incerteza",  component: <ConfidenceDistribution data={detStats?.confidence ?? []} theme={currentTheme} /> },
    anomaly:    { label: "Mapa de Anomalias",           component: <AnomalyScatterChart    data={detStats?.anomaly ?? []}  theme={currentTheme} /> },
  };

  return (
    <div className={`panel-theme-${currentTheme} h-screen max-h-screen w-full relative flex overflow-hidden p-6 transition-colors duration-300`}>
      <main className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch h-full min-h-0">
        <RenderColumn config={DASHBOARD_CONFIG.col1} componentMap={COMPONENT_MAP} theme={currentTheme} />
        <RenderColumn config={DASHBOARD_CONFIG.col2} componentMap={COMPONENT_MAP} theme={currentTheme} />
        <RenderColumn config={DASHBOARD_CONFIG.col3} componentMap={COMPONENT_MAP} theme={currentTheme} />
      </main>

      <LogReportModal
        isOpen={isPopUpModalOpen}
        onClose={closePopUpModal}
        data={reportData}
        theme={currentTheme}
      />
    </div>
  );
};

export default LogsPage;