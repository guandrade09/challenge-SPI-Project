import { useMemo, useState } from 'react';
import { Activity, ShieldAlert, Target } from 'lucide-react';
import { EpiAbsenceChart } from '../../../components/graficos/EpiAbsenceChart';
import { buildEpiAbsenceData, EPI_ABSENCE_OPTIONS } from '../../../utils/epiAbsenceData';
import { AnalysisCard } from './AnalysisCard';

const EMPTY_ARRAY = [];
const formatCount = (value) => value.toLocaleString('pt-BR');

export function EpiAbsenceAnalysis({ items = EMPTY_ARRAY, theme = 'dynamic' }) {
  const [selectedEpi, setSelectedEpi] = useState('capacete');
  const { data, totals } = useMemo(() => buildEpiAbsenceData(items), [items]);
  const epiLabel = EPI_ABSENCE_OPTIONS.find(({ id }) => id === selectedEpi).label;
  const selectedCount = totals.byEpi[selectedEpi];
  const share = totals.totalAbsent > 0 ? (selectedCount / totals.totalAbsent) * 100 : 0;
  const formattedShare = share.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  return (
    <AnalysisCard
      theme={theme}
      icon={ShieldAlert}
      title="Ausências por EPI"
      badgeText="Por EPI"
      chartComponent={
        <div className="flex h-full w-full flex-col gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Selecionar EPI para análise">
            {EPI_ABSENCE_OPTIONS.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                aria-pressed={selectedEpi === id}
                onClick={() => setSelectedEpi(id)}
                className={`rounded-lg border border-theme-divider px-2.5 py-1.5 text-xs transition-colors ${
                  selectedEpi === id ? 'panel-btn-toggle font-bold' : 'text-[var(--p-text-logs)] hover:opacity-80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1" role="region" aria-label={`Ausências de ${epiLabel} e total de EPIs ausentes`}>
            <EpiAbsenceChart data={data} selectedEpi={selectedEpi} epiLabel={epiLabel} />
          </div>
        </div>
      }
      infoItems={[
        {
          icon: ShieldAlert,
          title: `${epiLabel} ausente`,
          description: `${formatCount(selectedCount)} de ${formatCount(totals.totalAbsent)} detecções de EPIs ausentes (${formattedShare}%).`,
        },
        {
          icon: Activity,
          title: 'Total de EPIs ausentes',
          description: `${formatCount(totals.totalAbsent)} detecções de EPIs ausentes no período. A linha mostra esse total por minuto e permanece igual ao selecionar outro EPI.`,
        },
        {
          icon: Target,
          title: 'Comparação por EPI',
          description: 'Selecione um EPI para ver suas ausências nas barras. O percentual compara suas ausências com todas as ausências de EPIs registradas no mesmo período.',
        },
      ]}
    />
  );
}

export default EpiAbsenceAnalysis;
