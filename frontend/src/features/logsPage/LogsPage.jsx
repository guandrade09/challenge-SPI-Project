// src/features/logsPage/LogsPage.jsx
import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { AiChatSidebar } from '../../components/shared/chatAi/AiChatSidebar';

// Importando o componente que você criou (ajustado o nome do arquivo/import)
import { RenderColumn } from './RenderColumn'; 

// Graficos
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

} from './components/graficos';

import { LogPanel, LogReportModal } from './components/painelLog';

// Logs para test
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
  reportSummaryMock,
  radarData,
  confidenceData,
  resourceData,
} from './test';

const COMPONENT_MAP = {
  // Pagina de Logs
  logs: { label: "Central de Logs", component: <LogPanel logs={dummyLogs} /> },

  // Graficos

  // ML
 // Coluna 2
 area: { label: "Análise Composta", component: <AreaDetectionChart data={areaLogs} /> },
 composed: { label: "Análise de Eventos", component: <DetectionComposedChart data={composedLogs} /> },
 radar: { label: "Eficiencia Operacional", component: <OperationalRadar data={radarData}/> },
 latency: { label: "Latência MCU/CAM", component: <InferenceLatencyChart data={latencyLogs} /> },
 monitorcpu : { label: 'Temperatura CPUs', component: <ResourceMonitor data={resourceData} /> },
 
 // Logs
 // Coluna 3
 pizza: { label: "Grafico de detecções", component: <DashboardChart data={pizzaLogs} />},
 linha: { label: "Grafico de alertas", component: <DetectionLineChart data={lineLogs} />},
 barra: { label: "Detecções por Categoria", component: <DetectionBarChart data={colunasLogs} /> },
 
 matrix: { label: "Matriz de Confusão", component: <MLConfusionMatrix data={confusionMatrixData} /> },
 confidence: { label: 'Termometro de Incerteza', component: <ConfidenceDistribution data={confidenceData} />},
 anomaly: { label: "Mapa de Anomalias", component: <AnomalyScatterChart data={anomalyData} /> },
  
};

const DASHBOARD_CONFIG = {
  col1: [['logs']],
  col2: [['area', 'composed',], ['radar', 'latency', 'monitorcpu', ]],
  col3: [['pizza', 'linha', 'barra',], ['matrix', 'confidence', 'anomaly']]
};

const LogsPage = () => {
  const { 
    isSidebarOpen, 
    closeSidebar, 
    isPopUpModalOpen, 
    closePopUpModal 
  } = useUiStore();

  return (
    <div className="relative w-full h-screen flex overflow-hidden bg-gradient-to-tr from-neutral-500 to-neutral-950 p-4">
      
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/40 z-40 transition-opacity" onClick={closeSidebar} />
      )}

      <main className="w-full max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch h-full min-h-0">
        {/* Passamos o CONFIG e o MAP para o componente externo */}
        <RenderColumn config={DASHBOARD_CONFIG.col1} componentMap={COMPONENT_MAP} />
        <RenderColumn config={DASHBOARD_CONFIG.col2} componentMap={COMPONENT_MAP} />
        <RenderColumn config={DASHBOARD_CONFIG.col3} componentMap={COMPONENT_MAP} />
      </main>

      <AiChatSidebar />
      <LogReportModal isOpen={isPopUpModalOpen} onClose={closePopUpModal} data={reportSummaryMock} />
    </div>
  );
};

export default LogsPage;