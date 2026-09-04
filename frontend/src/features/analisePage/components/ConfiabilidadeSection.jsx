import React from 'react';
import {
  ShieldCheck,
  Grid,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
} from 'lucide-react';

import { AnalysisCard } from './AnalysisCard';
import { MLConfusionMatrix, ConfidenceDistribution } from '../../../components/graficos';

// Mocks padrão para fallback caso não venham via props
const CONFIDENCE_DISTRIBUTION_MOCK = [
  { range: '0-20%', quantidade: 12 },
  { range: '20-40%', quantidade: 28 },
  { range: '40-60%', quantidade: 65 },
  { range: '60-80%', quantidade: 210 },
  { range: '80-100%', quantidade: 840 },
];

const CONFUSION_MATRIX_MOCK = [
  { actual: 'Capacete', predicted: 'Capacete', value: 92 },
  { actual: 'Capacete', predicted: 'Colete', value: 5 },
  { actual: 'Capacete', predicted: 'Oculos', value: 3 },
  { actual: 'Colete', predicted: 'Capacete', value: 4 },
  { actual: 'Colete', predicted: 'Colete', value: 89 },
  { actual: 'Colete', predicted: 'Oculos', value: 7 },
  { actual: 'Oculos', predicted: 'Capacete', value: 2 },
  { actual: 'Oculos', predicted: 'Colete', value: 11 },
  { actual: 'Oculos', predicted: 'Oculos', value: 87 },
];

export function ConfiabilidadeSection({
  confusionData = CONFUSION_MATRIX_MOCK,
  confidenceData = CONFIDENCE_DISTRIBUTION_MOCK,
}) {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* CARD 1: TERMÔMETRO DE INCERTEZA / DISTRIBUIÇÃO DE CONFIANÇA */}
      <AnalysisCard
        icon={BarChart2}
        iconColor="text-emerald-400"
        title="Termômetro de Incerteza & Distribuição de Confiança"
        badgeText="Histograma de Assertividade"
        badgeColor="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
        chartComponent={<ConfidenceDistribution data={confidenceData} theme="dynamic" />}
        infoItems={[
          {
            icon: CheckCircle2,
            color: 'text-emerald-400',
            title: 'Zonas de Alta Confiança (80%-100%)',
            description:
              'Concentração ideal de inferências. Detecções nesta faixa possuem alto grau de certeza operacional e dispensam validação manual.',
          },
          {
            icon: AlertTriangle,
            color: 'text-amber-400',
            title: 'Zona de Calibração (60%-80%)',
            description:
              'Faixa intermediária. Eventos aqui podem gerar alertas contanto que passem por regras adicionais de persistência temporal.',
          },
          {
            icon: HelpCircle,
            color: 'text-rose-400',
            title: 'Incerteza Crítica (< 60%)',
            description:
              'Picos nesta zona indicam baixa iluminação, oclusões frequentes na câmera ou ruídos de imagem que exigem ajuste no sensor.',
          },
        ]}
      />

      {/* CARD 2: MATRIZ DE CONFUSÃO */}
      <AnalysisCard
        icon={Grid}
        iconColor="text-indigo-400"
        title="Matriz de Confusão do Modelo (Ground Truth vs Predito)"
        badgeText="Cross-Validation Heatmap"
        badgeColor="bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
        chartComponent={<MLConfusionMatrix data={confusionData} theme="dynamic" />}
        infoItems={[
          {
            icon: CheckCircle2,
            color: 'text-indigo-400',
            title: 'Diagonal Principal (Precisão)',
            description:
              'Representa a porcentagem de acertos diretos do modelo para cada classe de EPI (Capacete, Colete e Óculos).',
          },
          {
            icon: Eye,
            color: 'text-amber-400',
            title: 'Confusão Cruzada (Fora da Diagonal)',
            description:
              'Valores elevados fora da diagonal indicam trocas de classe pelo modelo (ex: confundir Óculos com Colete devido a reflexos).',
          },
        ]}
      />
    </div>
  );
}

export default ConfiabilidadeSection;