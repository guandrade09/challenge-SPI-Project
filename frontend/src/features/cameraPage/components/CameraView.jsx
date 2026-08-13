import React, { useEffect, useRef, useState } from 'react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

const WS_URL = 'ws://localhost:8765';

const CORNER_CLASSES = [
  'top-4 left-4 border-t-2 border-l-2',
  'top-4 right-4 border-t-2 border-r-2',
  'bottom-4 left-4 border-b-2 border-l-2',
  'bottom-4 right-4 border-b-2 border-r-2',
];

export function CameraView({ isMaximized = false }) {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [uptime, setUptime] = useState(0);

  const addAlerta = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);

  useEffect(() => {
    function connect() {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'frame' && imgRef.current) {
            imgRef.current.src = `data:image/jpeg;base64,${msg.data}`;
          } else if (msg.type === 'alert') {
            addAlerta(msg);
          } else if (msg.type === 'detections') {
            setLiveDetections(msg.data);
          }
        } catch {
          // Fail-silent
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (imgRef.current) imgRef.current.src = '';
        reconnectRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [addAlerta, setLiveDetections]);

  useEffect(() => {
    if (!connected) {
      setUptime(0);
      return;
    }
    const id = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [connected]);

  const formatUptime = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    // 🚀 Usando 'panel-base' e variáveis CSS do tema para o container pai
    <div className="panel-base min-h-0 flex flex-col w-full h-full text-[var(--p-text)] transition-colors duration-300">
      
      {/* Visor Central do Streaming */}
      <div className={`relative flex items-center justify-center overflow-hidden bg-[var(--p-graf-bg)] transition-all duration-300 ${
        isMaximized ? 'flex-1 h-full min-h-[400px]' : 'h-[520px]'
      }`}>
        {CORNER_CLASSES.map((classes, i) => (
          <div 
            key={i} 
            className={`absolute w-5 h-5 z-10 pointer-events-none transition-colors duration-300 ${
              connected ? 'border-[var(--p-subtext)]' : 'border-[var(--p-border)]'
            } ${classes}`} 
          />
        ))}

        {connected && (
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--p-subtext)] to-transparent z-20 pointer-events-none animate-[scanline_4s_linear_infinite]" />
        )}

        {!connected && (
          <div 
            className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(45deg, var(--p-text) 25%, transparent 25%), 
                linear-gradient(-45deg, var(--p-text) 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, var(--p-text) 75%), 
                linear-gradient(-45deg, transparent 75%, var(--p-text) 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
            }}
          />
        )}

        <img
          ref={imgRef}
          alt="SPI Streaming"
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${
            connected ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {!connected && (
          <div className="relative z-10 text-center select-none p-6 rounded-xl bg-[var(--p-bg)] border border-[var(--p-border)] shadow-xl backdrop-blur-sm">
            <p className="font-mono text-xs font-bold tracking-widest text-[var(--p-text)] animate-pulse">
              SEM SINAL TRANSMISSÃO
            </p>
            <p className="font-mono text-[10px] text-[var(--p-text)] opacity-60 mt-2 truncate max-w-xs px-2">
              {WS_URL}
            </p>
          </div>
        )}
      </div>

      {/* Footer Unificado - Usando estilos e bordas do tema */}
      <div className="flex items-center justify-between p-4 font-mono text-xs shrink-0 border-t border-[var(--p-border)] bg-[var(--p-header-bg)] transition-colors duration-300">
        
        {/* Lado Esquerdo: Tempo de transmissão */}
        <span className="font-medium text-[var(--p-text)]">
          {connected ? (
            <span className="text-[var(--p-subtext)] font-bold">
              {formatUptime(uptime)}{' '}
              <span className="font-normal opacity-60 text-[var(--p-text)]">· online</span>
            </span>
          ) : (
            <span className="opacity-60 text-[var(--p-text)]">--:--:-- · offline</span>
          )}
        </span>

        {/* Lado Direito: Status da conexão */}
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide select-none">
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              connected 
                ? 'bg-[var(--p-subtext)] shadow-[0_0_10px_var(--p-subtext)] animate-pulse' 
                : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
            }`} 
          />
          <span className={connected ? 'text-[var(--p-subtext)] font-bold' : 'text-amber-500 font-bold'}>
            {connected ? 'conectado' : 'aguardando'}
          </span>
        </div>

      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 0; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default CameraView;