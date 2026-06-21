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
  [PANEL_STATUS.ALERTA_CRITICO]: {
    dotColor:  '#ff2d2d',
    dotGlow:   'none',
    textColor: '#ff2d2d',
    label:     'ALERTA CRÍTICO',
    pulse:     false,
  },
  [PANEL_STATUS.ALERTA_MULTIPLO]: {
    dotColor:  '#ff6b2d',
    dotGlow:   'none',
    textColor: '#ff6b2d',
    label:     'ALERTA MÚLTIPLO',
    pulse:     false,
  },
};

export const AlertPanel = ({ message, status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG[PANEL_STATUS.PRONTO];

  return (
    <div style={{
      borderRadius: 8,
      border: '1px solid #1e2025',
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: '#141518',
        borderBottom: '1px solid #1e2025',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
          background: c.dotColor,
          boxShadow: c.dotGlow !== 'none' ? `0 0 0 3px ${c.dotGlow}` : 'none',
          animation: c.pulse ? 'alertPulse 2s infinite' : 'none',
        }} />
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: c.textColor,
        }}>
          {c.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ background: '#0d0e10', padding: '12px 14px' }}>
        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: 12,
          color: '#6a6e7a',
          lineHeight: 1.65,
          letterSpacing: '0.01em',
          margin: 0,
        }}>
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