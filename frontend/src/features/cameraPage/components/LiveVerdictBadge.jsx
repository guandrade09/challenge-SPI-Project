import React from 'react';
import { formatLiveIncidentReasons, formatLiveVerdictStatus } from '../../../utils/liveIncidentLabels';

export function LiveVerdictBadge({ verdict }) {
  if (!verdict) return null;
  const critical = ['ALERTA_CRITICO', 'ALERTA_MULTIPLO'].includes(verdict.status);
  const alert = critical || verdict.status === 'ALERTA';
  const reasons = formatLiveIncidentReasons(verdict.reasons);
  return <section role="status" aria-label="Incidentes em tempo real" data-testid="live-verdict"
    className={`w-fit max-w-full rounded-xl border bg-black/80 px-3 py-2 text-white shadow-lg backdrop-blur-md ${critical ? 'border-red-400/60' : alert ? 'border-amber-400/60' : 'border-emerald-400/40'}`}>
    <div className="flex items-center gap-2 text-xs font-semibold">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${critical ? 'bg-red-400 animate-pulse' : alert ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      {formatLiveVerdictStatus(verdict.status)}
    </div>
    {reasons.length > 0 && <ul className="mt-2 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto text-[11px] leading-4">
      {reasons.map((reason) => <li key={reason} className="max-w-full rounded-md bg-white/10 px-2 py-1 [overflow-wrap:anywhere]">{reason}</li>)}
    </ul>}
  </section>;
}
