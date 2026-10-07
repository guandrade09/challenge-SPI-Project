import React, { useState } from 'react';
import { Eye, HardHat, MapPin, Calendar, FileText, ImageOff } from 'lucide-react';
import { analyzeEventLog } from '../../../utils/eventDetails';

function DetectionFrame({ event, onValidate }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="overflow-hidden rounded-lg border border-theme-divider bg-[var(--p-header-bg)]">
      {event.imagem && !failed ? (
        <button type="button" onClick={() => onValidate(event)} className="block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-accent)]" aria-label="Abrir validação desta detecção" title="Clique para validar a detecção">
          <img
            src={event.imagem}
            alt={`Frame da detecção de ${event.tipo} em ${event.setor}, ${event.timestamp}`}
            className="w-full max-h-72 object-contain bg-black/20"
            onError={() => setFailed(true)}
          />
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 min-h-36 p-4 text-theme-muted text-center">
          <ImageOff size={24} />
          <p>{failed ? 'Não foi possível carregar o frame desta detecção.' : 'Esta detecção não possui frame disponível.'}</p>
        </div>
      )}
      <figcaption className="px-3 py-2 text-[11px] text-theme-muted">Frame registrado no momento da detecção{event.imagem && !failed ? ' · Clique para validar' : ''}</figcaption>
    </figure>
  );
}

export function EventDetailsCard({ event, onValidate }) {
  const isLog = event?.origem === 'Log';
  const logAnalysis = isLog ? event.analise || analyzeEventLog(event.detalhes).analise : null;

  return (
    <div className="flex-1 flex flex-col panel-base p-4 shadow-md">
      <h3 className="text-sm font-bold uppercase tracking-wider text-theme-accent border-b border-theme-divider pb-3 mb-4 flex items-center gap-2 font-theme-title">
        <Eye size={18} />
        Detalhes da Ocorrência
      </h3>

      {event ? (
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider font-mono">
            <span className="text-theme-muted">ID: {event.id}</span>
            <span className={`font-bold ${event.gravidade === 'alta' || event.gravidade === 'critico' ? 'text-red-500' : event.urgency === 'epi' ? 'text-blue-500' : 'text-amber-500'}`}>
              GRAVIDADE {event.gravidade.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              {isLog ? <FileText className="w-4 h-4 text-[var(--p-subtext)] shrink-0 mt-0.5" /> : <HardHat className="w-4 h-4 text-[var(--p-subtext)] shrink-0 mt-0.5" />}
              <div>
                <p className="text-theme-head">{isLog ? 'Log Identificado' : 'Detecção Registrada'}</p>
                <p className="font-semibold text-sm text-theme-main">{event.tipo}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[var(--p-subtext)] shrink-0 mt-0.5" />
              <div>
                <p className="text-theme-head">Local / Câmera</p>
                <p className="font-semibold text-theme-main">{event.setor}</p>
                <p className="text-[11px] text-theme-muted">{event.camera}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-[var(--p-subtext)] shrink-0 mt-0.5" />
              <div>
                <p className="text-theme-head">Data e Hora</p>
                <p className="font-mono text-theme-main">{event.timestamp}</p>
              </div>
            </div>
          </div>

          {isLog ? (
            <div className="rounded-lg border border-theme-divider bg-[var(--p-header-bg)] p-3">
              <p className="text-theme-head mb-2">Mensagem do log</p>
              <pre className="font-mono text-[11px] text-theme-main whitespace-pre-wrap break-words max-h-48 overflow-y-auto">{event.detalhes || 'Mensagem não disponível.'}</pre>
            </div>
          ) : (
            <DetectionFrame key={`${event.id}:${event.imagem}`} event={event} onValidate={onValidate} />
          )}

          <div className="mt-auto pt-3 border-t border-theme-divider space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-theme-muted">Status Atual:</span>
              <span className="font-mono font-bold text-xs uppercase px-2.5 py-1 rounded badge-theme-industrial">
                {event.status}
              </span>
            </div>
            {isLog && <p className="text-xs leading-relaxed text-theme-main">{logAnalysis}</p>}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-theme-muted">
          Selecione um evento na lista ao lado.
        </div>
      )}
    </div>
  );
}

export default EventDetailsCard;
