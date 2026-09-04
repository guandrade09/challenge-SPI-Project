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
  Activity
} from 'lucide-react';

import { AnalysisCard } from './AnalysisCard';
import {DashboardChart, DetectionBarChart, DetectionLineChart} from '../../../components/graficos';

// Dados Mocks para teste (Substitua pelos dados vindos do seu arquivo de mocks/API)
const ML_PERFORMANCE_MOCKS = {
  pieData: [
    { name: 'Pessoas', value: 450, color: '#6366f1' },
    { name: 'Veículos', value: 300, color: '#10b981' },
    { name: 'Equipamentos', value: 150, color: '#f59e0b' },
    { name: 'Outros', value: 80, color: '#64748b' },
  ],
  barData: [
    { name: 'Câmera 01', detectado: 320, naoDetectado: 45 },
    { name: 'Câmera 02', detectado: 480, naoDetectado: 20 },
    { name: 'Câmera 03', detectado: 210, naoDetectado: 90 },
    { name: 'Câmera 04', detectado: 510, naoDetectado: 15 },
  ],
  lineData: [
    { hora: '00:00', alertas: 12 },
    { hora: '04:00', alertas: 8 },
    { hora: '08:00', alertas: 45 },
    { hora: '12:00', alertas: 68 },
    { hora: '16:00', alertas: 52 },
    { hora: '20:00', alertas: 29 },
  ],
};

export function MlSection() {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* CARD 1: Prevalência de Objetos (Pie/Donut Chart) */}
      <AnalysisCard
        icon={PieIcon}
        iconColor="text-indigo-400"
        title="Distribuição e Prevalência de Objetos Detectados"
        badgeText="Gráfico Rosca / Donut"
        badgeColor="bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
        chartComponent={
          <DashboardChart data={ML_PERFORMANCE_MOCKS.pieData} theme="dynamic" />
        }
        infoItems={[
          {
            icon: Target,
            color: 'text-indigo-400',
            title: 'Análise de Composição',
            description: 'Indica a proporção das classes identificadas pelo modelo de ML no período selecionado.',
          },
          {
            icon: HelpCircle,
            color: 'text-sky-400',
            title: 'Como Utilizar',
            description: 'Passe o mouse sobre os badges ou fatias para isolar a contagem exata e avaliar desequilíbrios na amostragem.',
          },
          {
            icon: AlertTriangle,
            color: 'text-amber-400',
            title: 'Viés de Detecção',
            description: 'Se uma única classe dominar >80% das inferências, verifique se há ociosidade de monitoramento nas demais categorias.',
          },
        ]}
      />

      {/* CARD 2: Comparativo de Eficiência (Bar Chart) */}
      <AnalysisCard
        icon={BarChart2}
        iconColor="text-emerald-400"
        title="Eficiência de Detecção por Ponto de Captura"
        badgeText="Gráfico de Barras Agrupadas"
        badgeColor="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
        chartComponent={
          <DetectionBarChart data={ML_PERFORMANCE_MOCKS.barData} theme="dynamic" />
        }
        infoItems={[
          {
            icon: CheckCircle2,
            color: 'text-emerald-400',
            title: 'Taxa de Assertividade',
            description: 'Compara a quantidade de alvos confirmados (Detectados) vs. falhas de enquadramento (Não Detectados).',
          },
          {
            icon: Info,
            color: 'text-sky-400',
            title: 'Diagnóstico Operacional',
            description: 'Câmeras com alta taxa de "Não Detectado" podem apresentar problemas de iluminação, oclusão ou ângulo de montagem.',
          },
        ]}
      />

      {/* CARD 3: Tendência Temporal de Alertas (Line Chart) */}
      <AnalysisCard
        icon={TrendingUp}
        iconColor="text-rose-400"
        title="Evolução Temporal da Geração de Alertas"
        badgeText="Gráfico de Linha Contínua"
        badgeColor="bg-rose-500/10 text-rose-300 border-rose-500/20"
        chartComponent={
          <DetectionLineChart data={ML_PERFORMANCE_MOCKS.lineData} theme="dynamic" />
        }
        infoItems={[
          {
            icon: Activity,
            color: 'text-rose-400',
            title: 'Picos de Incidência',
            description: 'Mapeia os horários com maior volume de alertas gerados pelos algoritmos de visão computacional.',
          },
          {
            icon: AlertTriangle,
            color: 'text-amber-400',
            title: 'Anomalias de Horário',
            description: 'Surtos de alertas fora do horário comercial podem representar acessos não autorizados ou alteração nas condições do ambiente.',
          },
        ]}
      />
    </div>
  );
}

export default MlSection;