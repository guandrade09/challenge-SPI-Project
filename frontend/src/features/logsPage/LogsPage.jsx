import { useUiStore } from '../../store/useUiStore';
import { RenderColumn } from './RenderColumn';
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
import {
  dummyLogs,
  colunasLogs,
  areaLogs,
  lineLogs,
  pizzaLogs,
  composedLogs,
  confusionMatrixData,
  latencyLogs,
  anomalyData,
  radarData,
  confidenceData,
  resourceData,
} from '../../mocks/logsPageMocks/test';

const DASHBOARD_CONFIG = {
  col1: [['logs']],
  col2: [['area', 'composed'], ['radar', 'latency', 'monitorcpu']],
  col3: [['pizza', 'linha', 'barra'], ['matrix', 'confidence', 'anomaly']],
};

const LogsPage = () => {
  // Tema unificado para os gráficos e painéis da página ("light" | "dark" | "dynamic")
  const currentTheme = useUiStore((s) => s.theme); // Obtém o tema atual do Zustand para garantir reatividade 

  const isPopUpModalOpen = useUiStore((s) => s.isPopUpModalOpen);
  const closePopUpModal  = useUiStore((s) => s.closePopUpModal);
  const reportData       = useUiStore((s) => s.reportData);

  const COMPONENT_MAP = {
    logs: { label: "Central de Logs", component: <LogPanel logs={dummyLogs} theme={currentTheme}/> },

    // Coluna 2 — Análise e Monitoramento
    area:     { label: "Análise Composta",        component: <AreaDetectionChart    data={areaLogs}  theme={currentTheme}    /> },
    composed: { label: "Análise de Eventos",       component: <DetectionComposedChart data={composedLogs} theme={currentTheme} /> },
    radar:    { label: "Eficiência Operacional",   component: <OperationalRadar       data={radarData}  theme={currentTheme}   /> },
    latency:  { label: "Latência MCU/CAM",         component: <InferenceLatencyChart  data={latencyLogs} theme={currentTheme}  /> },
    monitorcpu: { label: "Temperatura CPUs",       component: <ResourceMonitor        data={resourceData} theme={currentTheme}  /> },

    // Coluna 3 — Detecções e ML
    pizza:    { label: "Gráfico de detecções",      component: <DashboardChart        data={pizzaLogs} theme={currentTheme}     /> },
    linha:    { label: "Gráfico de alertas",         component: <DetectionLineChart    data={lineLogs}  theme={currentTheme}    /> },
    barra:    { label: "Detecções por Categoria",    component: <DetectionBarChart     data={colunasLogs} theme={currentTheme}  /> },
    matrix:   { label: "Matriz de Confusão",          component: <MLConfusionMatrix     data={confusionMatrixData} theme={currentTheme}/> },
    confidence: { label: "Termômetro de Incerteza",  component: <ConfidenceDistribution data={confidenceData} theme={currentTheme} /> },
    anomaly:  { label: "Mapa de Anomalias",           component: <AnomalyScatterChart    data={anomalyData}  theme={currentTheme} /> },
  };

  return (
    // Alterado: Fixado h-screen e max-h-screen para evitar que o layout cresça ou quebre verticalmente
    <div className={`panel-theme-${currentTheme} h-screen max-h-screen w-full relative flex overflow-hidden p-6 transition-colors duration-300 bg-projeto-main`}>
      
      {/* Grid das Colunas com items-stretch e h-full para alinhar perfeitamente o topo e a base de todas as colunas */}
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