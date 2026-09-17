import React from 'react';
import { Eye, HardHat, MapPin, Calendar } from 'lucide-react';

export function EventDetailsCard({ event }) {
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
            <span className={`font-bold ${event.gravidade === 'alta' ? 'text-red-500' : 'text-amber-500'}`}>
              GRAVIDADE {event.gravidade.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <HardHat className="w-4 h-4 text-[var(--p-subtext)] shrink-0 mt-0.5" />
              <div>
                <p className="text-theme-head">Infração Detectada</p>
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

          <div className="mt-auto pt-3 border-t border-theme-divider flex items-center justify-between">
            <span className="text-xs text-theme-muted">Status Atual:</span>
            <span className="font-mono font-bold text-xs uppercase px-2.5 py-1 rounded badge-theme-industrial">
              {event.status}
            </span>
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