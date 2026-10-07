import React from 'react';
import {
  Grid,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
} from 'lucide-react';

import { AnalysisCard } from './AnalysisCard';
import { MLConfusionMatrix, ConfidenceDistribution } from '../../../components/graficos';

export function ConfiabilidadeSection({
  confusionData = [],
  confidenceData = [],
  theme = 'dynamic',
}) {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* CARD 1: TERMÔMETRO DE INCERTEZA */}
      <AnalysisCard
        theme={theme}
        icon={BarChart2}
        title="Termômetro de Incerteza & Distribuição de Confiança"
        badgeText="Decisões por Faixa de Confiança"
        chartComponent={<ConfidenceDistribution data={confidenceData} theme={theme} />}
        infoItems={[
          {
            icon: CheckCircle2,
            title: 'Zonas de Alta Confiança (80%-100%)',
            description:
              'Quantidade de decisões registradas com confiança entre 80% e 100%. Confiança do modelo não equivale a acerto comprovado.',
          },
          {
            icon: AlertTriangle,
            title: 'Zona de Calibração (60%-80%)',
            description:
              'Faixa intermediária. Eventos aqui podem gerar alertas contanto que passem por regras adicionais de persistência temporal.',
          },
          {
            icon: HelpCircle,
            title: 'Incerteza Crítica (< 60%)',
            description:
              'Picos nesta zona indicam baixa iluminação, oclusões frequentes na câmera ou ruídos de imagem que exigem ajuste no sensor.',
          },
        ]}
      />

      {/* CARD 2: MATRIZ DE CONFUSÃO */}
      <AnalysisCard
        theme={theme}
        icon={Grid}
        title="Matriz de Confusão do Modelo (Ground Truth vs Predito)"
        badgeText="Cross-Validation Heatmap"
        chartComponent={<MLConfusionMatrix data={confusionData} theme={theme} />}
        infoItems={[
          {
            icon: CheckCircle2,
            title: 'Diagonal Principal (Precisão)',
            description:
              'Representa a porcentagem de acertos diretos do modelo para cada classe de EPI (Capacete, Colete e Óculos).',
          },
          {
            icon: Eye,
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