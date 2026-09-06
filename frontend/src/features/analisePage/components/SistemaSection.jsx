import React from 'react';
import { Server, AreaChart, Layers, Cpu, Activity, Clock } from 'lucide-react';
import { AnalysisCard } from './AnalysisCard';
import {
  ResourceMonitor,
  AreaDetectionChart,
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
        headerAction={ThreadToggleButton}
        chartComponent={
          <ResourceMonitor
            data={realTimeResourceData}
            theme={theme}
            linesConfig={metricsConfig}
          />
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

      {/* CARD 2: ANÁLISE COMPOSTA */}
      <AnalysisCard
        theme={theme}
        icon={AreaChart}
        title="Análise Composta de Eventos e Processamento"
        badgeText="Série Temporal"
        chartComponent={
          <AreaDetectionChart data={hourlyData} theme={theme} />
        }
        infoItems={[
          {
            icon: Clock,
            title: 'Volume Diário por Faixa Horária',
            description:
              'Mapeia a densidade de eventos e quadros analisados hora a hora para identificar horários de pico operacional.',
          },
        ]}
      />

      {/* CARD 3: ANÁLISE DE EVENTOS */}
      <AnalysisCard
        theme={theme}
        icon={Layers}
        title="Análise de Eventos (Alertas vs Total Processado)"
        badgeText="Composto Multieixo"
        chartComponent={
          <DetectionComposedChart data={hourlyData} theme={theme} />
        }
        infoItems={[
          {
            icon: Activity,
            title: 'Taxa de Conversão em Alertas',
            description:
              'Relaciona o total de frames/objetos analisados com o total de alertas críticos gerados no mesmo período.',
          },
        ]}
      />
    </div>
  );
}

export default SistemaSection;