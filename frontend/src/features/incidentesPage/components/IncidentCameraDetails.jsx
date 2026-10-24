import { Activity, AlertTriangle, MapPin, Shield } from 'lucide-react';
import { ConfidenceBadge } from '../../../components/ui/Badge';
import { formatLabel } from '../../../utils/formatLabel';

export function IncidentCameraDetails({ cameraDetails, source }) {
  const { epi, ergonomia, zona, analysisErrors = [] } = cameraDetails;
  return (
    <div className="flex flex-col gap-4" data-camera-details={source}>
      {analysisErrors.map((message, index) => (
        <p key={index} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-theme-main">{message}</p>
      ))}
      {epi.length > 0 && (
        <section className="panel-subcard shadow-lg flex flex-col gap-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-blue-500 font-bold flex items-center gap-1.5">
            <Shield size={14} /> Equipamentos de proteção
          </h3>
          {epi.map((item, index) => {
            const ausente = item.label?.toLowerCase().includes('ausente');
            return (
              <div key={index} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${ausente ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'}`}>
                <span className="font-semibold">{ausente ? '✖' : '✓'} {formatLabel(item.label)}</span>
                <ConfidenceBadge value={item.confidence} />
              </div>
            );
          })}
        </section>
      )}
      {ergonomia.length > 0 && (
        <section className="panel-subcard shadow-lg flex flex-col gap-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-purple-500 dark:text-purple-400 font-bold flex items-center gap-1.5">
            <Activity size={14} /> Análise ergonômica (REBA)
          </h3>
          {ergonomia.map((person, index) => {
            const score = person.reba_score;
            const color = score >= 7 ? 'text-red-500 bg-red-500/15 border-red-500/40' : score >= 4 ? 'text-amber-500 bg-amber-500/15 border-amber-500/40' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/40';
            return (
              <div key={index} className="flex flex-col gap-2 p-2.5 rounded-lg text-xs border border-theme-divider bg-[var(--p-bg)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-theme-main font-semibold">Pessoa #{person.pessoa_id ?? index + 1}</span>
                  <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${color}`}>REBA {score ?? '—'} • {person.reba_level ?? 'N/A'}</span>
                </div>
                <ConfidenceBadge value={person.confianca ?? person.confidence ?? person.confianca_deteccao} />
                {person.queda && <span className="flex items-center gap-1.5 text-red-500 font-bold"><AlertTriangle size={12} /> Alerta de queda detectada</span>}
              </div>
            );
          })}
        </section>
      )}
      {zona.length > 0 && (
        <section className="panel-subcard shadow-lg flex flex-col gap-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5"><MapPin size={14} /> Perímetro / zona de alerta</h3>
          {zona.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 p-2.5 rounded-lg text-xs border border-theme-divider bg-[var(--p-bg)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-theme-main font-semibold">Pessoa #{item.pessoa_id ?? index + 1}</span>
                <span className={item.invadiu ? 'text-red-500 font-bold' : 'text-emerald-500'}>{item.invadiu ? '⚠ Invasão' : '✓ Normal'}</span>
              </div>
              {item.nome && <span className="text-theme-muted">{item.nome}</span>}
              {item.epis_ausentes?.length > 0 && <span className="text-red-500">Falta: {item.epis_ausentes.join(', ')}</span>}
            </div>
          ))}
        </section>
      )}
      {!epi.length && !ergonomia.length && !zona.length && !analysisErrors.length && (
        <p className="panel-subcard text-theme-muted text-xs">Sem detalhes identificados para esta câmera neste registro.</p>
      )}
    </div>
  );
}
