// src/features/logsPage/LogsPage.jsx
import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { X } from 'lucide-react';
import { DashboardChart, DetectionBarChart, DetectionLineChart, OperationalRadar, AreaDetectionChart, DetectionComposedChart, MLConfusionMatrix, InferenceLatencyChart, AnomalyScatterChart } from './components/graficos'
import { LogPanel, LogReportModal } from './components/painelLog'
import { dummyLogs, lineLogs, colunasLogs, pizzaLogs, radarData, areaLogs, composedLogs, confusionMatrixData, latencyLogs, anomalyData, reportSummaryMock } from './test'
import { AiChatSidebar } from '../../components/shared/chatAi/AiChatSidebar';

const LogsPage = () => {
  const { isSidebarOpen, closeSidebar } = useUiStore();
  const { isReportModalOpen, closeReportModal } = useUiStore();

  return (
    <div className="relative w-full h-screen flex overflow-hidden bg-gradient-to-tr from-neutral-500 to-neutral-950 p-4">
      
      {/* Overlay Escuro quando a sidebar abre */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* GRID PRINCIPAL DO DASHBOARD */}
      <main className="w-full max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch h-full min-h-0">
        
        {/* COLUNA 1: Logs */}
        <div className="w-full flex flex-col min-h-0">
          <LogPanel title="" logs="" />
        </div>

        {/* COLUNA 2 (CENTRO) */}
        <div className="w-full flex flex-col gap-8 min-h-0">
          {/* h-[45%] para o gráfico superior */}
          <div className="h-[45%] shrink-0 min-h-0">
            <AreaDetectionChart title="" data={areaLogs} />
          </div>
          {/* flex-1 para o console ocupar o resto sem estourar */}
          <div className="flex-1 min-h-0">
             <DetectionComposedChart title="" data={composedLogs} />
          </div>
        </div>

        {/* COLUNA 3: Gráficos */}
        <div className="w-full flex flex-col gap-8 min-h-0">
          <div className="h-[45%] shrink-0 min-h-0">
            <OperationalRadar title="" data={radarData} />
          </div>
          <div className="flex-1 min-h-0">
            <MLConfusionMatrix title="" data={confusionMatrixData} />
          </div>
        </div>

      </main>
      <AiChatSidebar/>

      <LogReportModal
      isOpen={isReportModalOpen}
      onClose={closeReportModal}
      data={reportSummaryMock}
      />
    </div>
  );
};

export default LogsPage;