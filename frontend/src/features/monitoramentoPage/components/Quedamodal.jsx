import React, { useEffect, useState } from 'react';

export const QuedaModal = ({ onClose }) => {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) => [
    String(Math.floor(s / 60)).padStart(2, '0'),
    String(s % 60).padStart(2, '0'),
  ].join(':');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#1a0a0a',
        border: '2px solid #e05252',
        borderRadius: 16,
        padding: '40px 48px',
        maxWidth: 480,
        width: '90vw',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(224,82,82,0.3)',
        animation: 'pulse-border 1s ease infinite',
      }}>
        {/* Ícone */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>

        {/* Título */}
        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 32, fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#e05252',
          margin: '0 0 8px',
        }}>
          QUEDA DETECTADA
        </p>

        {/* Subtítulo */}
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13, color: '#a0a4b0',
          margin: '0 0 24px',
          letterSpacing: '0.04em',
        }}>
          Um trabalhador pode ter caído. Verifique imediatamente.
        </p>

        {/* Cronômetro */}
        <div style={{
          background: '#0d0e10',
          borderRadius: 8,
          padding: '12px 24px',
          marginBottom: 32,
          display: 'inline-block',
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, color: '#4a4e5a',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            display: 'block', marginBottom: 4,
          }}>
            TEMPO DESDE DETECÇÃO
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 28, fontWeight: 700,
            color: '#e05252', letterSpacing: '0.1em',
          }}>
            {fmt(segundos)}
          </span>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              border: '1px solid #e05252',
              background: '#e05252',
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 15, fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Situação Verificada
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              border: '1px solid #3a3e4a',
              background: 'transparent',
              color: '#6a6e7a',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 15, fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Falso Alarme
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 60px rgba(224,82,82,0.3); }
          50%       { box-shadow: 0 0 80px rgba(224,82,82,0.6); }
        }
      `}</style>
    </div>
  );
};

export default QuedaModal;