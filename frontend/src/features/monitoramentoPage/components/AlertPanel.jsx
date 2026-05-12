import React from 'react';
import { PANEL_STATUS } from '../../../enums/enums';

const STATUS_CONFIG = {
  [PANEL_STATUS.PRONTO]: {
    dotColor:  '#3cc87a',
    dotGlow:   'rgba(60,200,122,0.2)',
    textColor: '#3cc87a',
    label:     'PRONTO',
    pulse:     true,
  },
  [PANEL_STATUS.ATENCAO]: {
    dotColor:  '#d4a017',
    dotGlow:   'rgba(212,160,23,0.2)',
    textColor: '#d4a017',
    label:     'ATENÇÃO',
    pulse:     true,
  },
  [PANEL_STATUS.ALERTA]: {
    dotColor:  '#e05252',
    dotGlow:   'none',
    textColor: '#e05252',
    label:     'ALERTA',
    pulse:     false,
  },
};

export const AlertPanel = ({ message, status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG[PANEL_STATUS.PRONTO];

  return (
    <div className="alert-panel">
      <div className="alert-panel-header">
        <span
          className="status-dot"
          style={{
            background: c.dotColor,
            boxShadow: c.dotGlow !== 'none' ? `0 0 0 3px ${c.dotGlow}` : 'none',
            animation: c.pulse ? 'alertPulse 2s infinite' : 'none',
          }}
        />
        <span
          className="label-mono font-medium"
          style={{
            fontSize: 10,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: c.textColor,
          }}
        >
          {c.label}
        </span>
      </div>

      <div className="alert-panel-body">
        <p
          style={{
            fontFamily: "'Barlow',sans-serif",
            fontSize: 12, color: '#6a6e7a',
            lineHeight: 1.65, letterSpacing: '.01em', margin: 0,
          }}
        >
          {message || 'Nenhuma mensagem.'}
        </p>
      </div>

      <style>{`
        @keyframes alertPulse {
          0%,100% { box-shadow: 0 0 0 2px ${c.dotGlow}; }
          50%      { box-shadow: 0 0 0 5px transparent; }
        }
      `}</style>
    </div>
  );
};

export default AlertPanel;