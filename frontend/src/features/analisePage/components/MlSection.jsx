import React from 'react';
import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Info,
  HelpCircle,
  Activity,
  Loader2
} from 'lucide-react';
import { AnalysisCard } from './AnalysisCard';
import { DashboardChart, DetectionBarChart, DetectionLineChart } from '../../../components/graficos';

export function MlSection({ detStats, loading, theme = 'dynamic' }) {
  if (loading && !detStats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-[var(--p-text-muted)]">
        <Loader2 className="animate-spin text-[var(--p-accent,#6366f1)]" size={32} />
        <p className="text-sm">Carregando métricas do modelo ML...</p>
      </div>
    );
  }

  const pieData = detStats?.pizza ?? [];
  const barData = detStats?.bar ?? [];
  const lineData = detStats?.hourly ?? [];

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* CARD 1: Prevalência de Objetos */}
      <AnalysisCard
        theme={theme}
        icon={PieIcon}
        title="Distribuição e Prevalência de Objetos Detectados"
        badgeText="Gráfico Rosca / Donut"
        chartComponent={
          <DashboardChart data={pieData} theme={theme} />
        }
        infoItems={[
          {
            icon: Target,
            title: 'Análise de Composição',
            description: 'Indica a proporção das classes identificadas pelo modelo de ML no período selecionado.',
          },
          {
            icon: HelpCircle,
            title: 'Como Utilizar',
            description: 'Passe o mouse sobre os badges ou fatias para isolar a contagem exata e avaliar desequilíbrios na amostragem.',
          },
          {
            icon: AlertTriangle,
            title: 'Viés de Detecção',
            description: 'Se uma única classe dominar >80% das inferências, verifique se há ociosidade de monitoramento nas demais categorias.',
          },
        ]}
      />

      {/* CARD 2: Comparativo de Eficiência */}
      <AnalysisCard
        theme={theme}
        icon={BarChart2}
        title="Eficiência de Detecção por Categoria"
        badgeText="Gráfico de Barras Agrupadas"
        chartComponent={
          <DetectionBarChart data={barData} theme={theme} />
        }
        infoItems={[
          {
            icon: CheckCircle2,
            title: 'Taxa de Assertividade',
            description: 'Compara a quantidade de alvos confirmados (Detectados) vs. falhas/ausências (Não Detectados).',
          },
          {
            icon: Info,
            title: 'Diagnóstico Operacional',
            description: 'Categorias com alta taxa de "Não Detectado" indicam baixa confiança da inferência ou não conformidades detectadas.',
          },
        ]}
      />

      {/* CARD 3: Tendência Temporal de Alertas */}
      <AnalysisCard
        theme={theme}
        icon={TrendingUp}
        title="Evolução Temporal da Geração de Alertas"
        badgeText="Gráfico de Linha Contínua"
        chartComponent={
          <DetectionLineChart data={lineData} theme={theme} />
        }
        infoItems={[
          {
            icon: Activity,
            title: 'Picos de Incidência',
            description: 'Mapeia os horários com maior volume de alertas gerados pelos algoritmos de visão computacional.',
          },
          {
            icon: AlertTriangle,
            title: 'Anomalias de Horário',
            description: 'Surtos de alertas fora do horário comercial podem representar acessos não autorizados ou alteração nas condições do ambiente.',
          },
        ]}
      />
    </div>
  );
}

export default MlSection;