import React from 'react';
import { formatLiveIncidentLabel, formatLiveIncidentReasons, formatLiveVerdictStatus } from '../../../utils/liveIncidentLabels';

// Até este número de pessoas, a caixa lista o REBA de todas. Acima disso, mostra um resumo
// e só quem está em risco, para a caixa não crescer e cobrir o vídeo com várias pessoas.
const MAX_PESSOAS_LISTA_COMPLETA = 1;

// Gravidade para ordenar e colorir: queda > ALTO > MÉDIO > baixo.
const gravidade = (p) => {
  if (p.queda) return 3;
  const nivel = (p.nivel || '').toUpperCase();
  if (nivel.includes('ALTO')) return 2;
  if (nivel.startsWith('M')) return 1;
  return 0;
};

const CHIP_CLASS = [
  'bg-emerald-500/20 text-emerald-200',
  'bg-amber-500/25 text-amber-200',
  'bg-red-500/25 text-red-200',
  'bg-red-500/25 text-red-200',
];

// `rebaPessoas`: REBA de cada pessoa na câmera ([{nome, nivel, score, queda}]), vindo da pose.
export function LiveVerdictBadge({ verdict, rebaPessoas = [] }) {
  if (!verdict) return null;
  const critical = ['ALERTA_CRITICO', 'ALERTA_MULTIPLO'].includes(verdict.status);
  const alert = critical || verdict.status === 'ALERTA';
  // O REBA de cada pessoa já aparece na linha própria abaixo; não repete nos motivos.
  const reasons = formatLiveIncidentReasons(verdict.reasons)
    .filter((reason) => rebaPessoas.length === 0 || !reason.startsWith('Reba '));

  // "Pessoa N" usa a posição na lista original, para o rótulo não mudar ao filtrar/ordenar.
  const pessoas = rebaPessoas.map((p, i) => ({ ...p, idx: i, rotulo: p.nome || (rebaPessoas.length > 1 ? `Pessoa ${i + 1}` : null) }));
  const cenaCheia = pessoas.length > MAX_PESSOAS_LISTA_COMPLETA;
  const emRisco = pessoas.filter((p) => gravidade(p) > 0);
  const listadas = cenaCheia
    ? [...emRisco].sort((a, b) => gravidade(b) - gravidade(a) || (b.score ?? 0) - (a.score ?? 0))
    : pessoas;

  return <section role="status" aria-label="Incidentes em tempo real" data-testid="live-verdict"
    className={`w-fit max-w-full rounded-xl border bg-black/80 px-3 py-2 text-white shadow-lg backdrop-blur-md ${critical ? 'border-red-400/60' : alert ? 'border-amber-400/60' : 'border-emerald-400/40'}`}>
    <div className="flex items-center gap-2 text-xs font-semibold">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${critical ? 'bg-red-400 animate-pulse' : alert ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      {formatLiveVerdictStatus(verdict.status)}
    </div>
    {reasons.length > 0 && <ul className="mt-2 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto text-[11px] leading-4">
      {reasons.map((reason) => <li key={reason} className="max-w-full rounded-md bg-white/10 px-2 py-1 [overflow-wrap:anywhere]">{reason}</li>)}
    </ul>}
    {cenaCheia && <p className="mt-2 text-[11px] leading-4 text-white/80">
      {pessoas.length} pessoas · {pessoas.length - emRisco.length} OK
      {emRisco.length > 0 && <span className="text-amber-200"> · {emRisco.length} em risco</span>}
    </p>}
    {listadas.length > 0 && <ul aria-label="REBA por pessoa" className="mt-2 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto text-[11px] leading-4">
      {listadas.map((p) => <li key={p.idx} className={`max-w-full rounded-md px-2 py-1 [overflow-wrap:anywhere] ${CHIP_CLASS[gravidade(p)]}`}>
        {p.rotulo ? `${p.rotulo} · ` : ''}
        {p.queda ? 'Queda' : formatLiveIncidentLabel(`reba_${p.nivel || 'baixo'}_${p.score ?? 1}`)}
      </li>)}
    </ul>}
  </section>;
}
