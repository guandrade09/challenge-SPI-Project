import React from 'react';
import { PANEL_STATUS } from '../../../enums/enums';

// Centralização limpa das cores utilizando classes de utilidade do Tailwind
const STATUS_CONFIG = {
  [PANEL_STATUS.PRONTO]: {
    dotClass: 'bg-[#3cc87a] shadow-[0_0_0_3px_rgba(60,200,122,0.2)] animate-pulse',
    textClass: 'text-[#3cc87a]',
    label: 'PRONTO',
  },
  [PANEL_STATUS.ATENCAO]: {
    dotClass: 'bg-[#d4a017] shadow-[0_0_0_3px_rgba(212,160,23,0.2)] animate-pulse',
    textClass: 'text-[#d4a017]',
    label: 'ATENÇÃO',
  },
  [PANEL_STATUS.ALERTA]: {
    dotClass: 'bg-[#e05252] shadow-none',
    textClass: 'text-[#e05252]',
    label: 'ALERTA',
  },
};

export const AlertPanel = ({ message, status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG[PANEL_STATUS.PRONTO];

  return (
    <div className="alert-panel flex flex-col gap-2 p-4 rounded-xl border border-[var(--p-border)] bg-[var(--p-bg)]">
      <div className="alert-panel-header flex items-center gap-2">
        {/* Indicador Luminoso de Status */}
        <span className={`status-dot w-2 h-2 rounded-full inline-block ${c.dotClass}`} />
        
        {/* Rótulo em Letras Monas */}
        <span className={`label-mono font-mono font-medium text-[10px] tracking-[0.14em] uppercase ${c.textClass}`}>
          {c.label}
        </span>
      </div>

      {/* Corpo da Mensagem de Log / Alerta */}
      <div className="alert-panel-body">
        <p
          className="text-[12px] leading-[1.65] tracking-[0.01em] m-0 panel-text-sub"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {message || 'Nenhuma mensagem.'}
        </p>
      </div>
    </div>
  );
};

export default AlertPanel;