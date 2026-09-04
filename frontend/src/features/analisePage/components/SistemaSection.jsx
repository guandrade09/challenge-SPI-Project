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
  theme = 'dark',
}) {
  // Busca os dados de recursos de hardware em tempo real usando a thread selecionada
  const { data: realTimeResourceData } = useResourceMetrics(currentThread, 15);

  // Obtém as configurações dinâmicas de eixos/linhas para o gráfico de recursos
  const metricsConfig = getThreadMetricsConfig(currentThread);

  // Botão seletor de thread
  const ThreadToggleButton = (
    <ThreadSelector currentThread={currentThread} onChange={onThreadChange} />
  );

  // Dados ordenados por hora das detecções e alertas consumidos via API
  const hourlyData = detStats?.hourly ?? [];

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* CARD 1: MONITOR DE RECURSOS DA THREAD / HARDWARE */}
      <AnalysisCard
        icon={Server}
        iconColor="text-cyan-400"
        title={`Recursos do Sistema (${getThreadLabel(currentThread)})`}
        badgeText="Telemetria Realtime"
        badgeColor="bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
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
            color: 'text-cyan-400',
            title: 'Uso de Processamento (CPU / JS Heap)',
            description:
              'Mede a carga instantânea de processamento na thread ativa. Picos persistentes acima de 80% indicam necessidade de escalabilidade.',
          },
          {
            icon: Activity,
            color: 'text-indigo-400',
            title: 'Gargalo e Volume de Processos',
            description:
              'Acompanha a estabilidade da fila de execução e vazamento de memória para evitar atrasos no pipeline de inferência.',
          },
        ]}
      />

      {/* CARD 2: ANÁLISE COMPOSTA (ÁREA TEMPORAL DE PROCESSAMENTO & ALERTAS) */}
      <AnalysisCard
        icon={AreaChart}
        iconColor="text-emerald-400"
        title="Análise Composta de Eventos e Processamento"
        badgeText="Série Temporal"
        badgeColor="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
        chartComponent={
          <AreaDetectionChart data={hourlyData} theme={theme} />
        }
        infoItems={[
          {
            icon: Clock,
            color: 'text-emerald-400',
            title: 'Volume Diário por Faixa Horária',
            description:
              'Mapeia a densidade de eventos e quadros analisados hora a hora para identificar horários de pico operacional.',
          },
        ]}
      />

      {/* CARD 3: ANÁLISE DE EVENTOS (COMPOSIÇÃO DE ALERTAS VS PROCESSAMENTO) */}
      <AnalysisCard
        icon={Layers}
        iconColor="text-violet-400"
        title="Análise de Eventos (Alertas vs Total Processado)"
        badgeText="Composto Multieixo"
        badgeColor="bg-violet-500/10 text-violet-300 border-violet-500/20"
        chartComponent={
          <DetectionComposedChart data={hourlyData} theme={theme} />
        }
        infoItems={[
          {
            icon: Activity,
            color: 'text-violet-400',
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