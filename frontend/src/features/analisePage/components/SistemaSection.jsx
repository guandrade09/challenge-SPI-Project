import React from 'react';
import { Server, Layers, Cpu, Activity } from 'lucide-react';
import { AnalysisCard } from './AnalysisCard';
import { EpiAbsenceAnalysis } from './EpiAbsenceAnalysis';
import {
  ResourceMonitor,
  DetectionComposedChart,
} from '../../../components/graficos';
import { ThreadSelector } from '../../../components/shared/ThreadSelector';
import { useResourceMetrics } from '../../../hooks/useResourceMetrics';
import { getThreadLabel, getThreadMetricsConfig } from '../../../utils/threadOptions';

export function SistemaSection({
  detStats,
  currentThread = 'backend_processor',
  onThreadChange,
  theme = 'dynamic',
}) {
  const { data: realTimeResourceData } = useResourceMetrics(currentThread, 15);
  const metricsConfig = getThreadMetricsConfig(currentThread);

  const ThreadToggleButton = (
    <ThreadSelector currentThread={currentThread} onChange={onThreadChange} />
  );

  const hourlyData = detStats?.hourly ?? [];

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* CARD 1: MONITOR DE RECURSOS */}
      <AnalysisCard
        theme={theme}
        icon={Server}
        title={`Recursos do Sistema (${getThreadLabel(currentThread)})`}
        badgeText="Telemetria Realtime"
        chartComponent={
          <div className="flex h-full w-full flex-col gap-3">
            {ThreadToggleButton}
            <div className="min-h-0 flex-1">
              <ResourceMonitor
                data={realTimeResourceData}
                theme={theme}
                linesConfig={metricsConfig}
              />
            </div>
          </div>
        }
        infoItems={[
          {
            icon: Cpu,
            title: 'Uso de Processamento (CPU / JS Heap)',
            description:
              'Mede a carga instantânea de processamento na thread ativa. Picos persistentes acima de 80% indicam necessidade de escalabilidade.',
          },
          {
            icon: Activity,
            title: 'Gargalo e Volume de Processos',
            description:
              'Acompanha a estabilidade da fila de execução e vazamento de memória para evitar atrasos no pipeline de inferência.',
          },
        ]}
      />

      <EpiAbsenceAnalysis items={detStats?.raw} theme={theme} />

      {/* CARD 3: ANÁLISE DE EVENTOS */}
      <AnalysisCard
        theme={theme}
        icon={Layers}
        title="Detecções e Confiança do Modelo"
        badgeText="Composto Multieixo"
        chartComponent={
          <DetectionComposedChart data={hourlyData} theme={theme} />
        }
        infoItems={[
          {
            icon: Activity,
            title: 'Volume e Confiança',
            description:
              'Compara o total de detecções registradas com aquelas acima de 80% de confiança e a confiança média no mesmo minuto.',
          },
        ]}
      />
    </div>
  );
}

export default SistemaSection;
