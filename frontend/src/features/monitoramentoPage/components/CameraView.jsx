import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';
import { useUiStore } from '../../../store/useUiStore'; 
import { ExpandButton } from '../../../components/shared/ExpandButton'; // Importado aqui

const WS_URL = 'ws://localhost:8765';

const CORNER_CLASSES = [
  'top-4 left-4 border-t-2 border-l-2',
  'top-4 right-4 border-t-2 border-r-2',
  'bottom-4 left-4 border-b-2 border-l-2',
  'bottom-4 right-4 border-b-2 border-r-2',
];

export function CameraView() {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const currentTheme = useUiStore((s) => s.theme);
  const isDark = currentTheme === 'dark';

  const [connected, setConnected] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = useCallback(() => setIsMaximized((p) => !p), []);

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
    <div className={`min-h-0 flex flex-col w-full transition-colors duration-300 ${
      isDark ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'
    }`}>
      
      {/* Header Dinâmico */}
      <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${
        isDark 
          ? 'border-neutral-800 bg-neutral-900/50' 
          : 'border-neutral-200 bg-neutral-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {['bg-red-500/80', 'bg-amber-500/80', 'bg-emerald-500/80'].map((bgClass, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${bgClass}`} />
            ))}
          </div>
          <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ml-1 ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            câmera ao vivo
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              connected 
                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' 
                : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
            }`} 
          />
          <span className={connected ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
            {connected ? 'conectado' : 'aguardando'}
          </span>
        </div>
      </div>

      {/* Visor Central do Streaming */}
      <div className="relative flex items-center justify-center h-[520px] overflow-hidden bg-neutral-950">
        {CORNER_CLASSES.map((classes, i) => (
          <div 
            key={i} 
            className={`absolute w-5 h-5 z-10 pointer-events-none transition-colors duration-300 ${
              connected ? 'border-emerald-500/50' : 'border-neutral-700'
            } ${classes}`} 
          />
        ))}

        {connected && (
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-20 pointer-events-none animate-[scanline_4s_linear_infinite]" />
        )}

        {!connected && (
          <div 
            className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #fff 25%, transparent 25%), 
                linear-gradient(-45deg, #fff 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #fff 75%), 
                linear-gradient(-45deg, transparent 75%, #fff 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
            }}
          />
        )}

        <img
          ref={imgRef}
          alt="Grower IA Stream"
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${
            connected ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {!connected && (
          <div className="relative z-10 text-center select-none p-6 rounded-xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm">
            <p className="font-mono text-xs font-bold tracking-widest text-neutral-100 animate-pulse">
              SEM SINAL TRANSMISSÃO
            </p>
            <p className="font-mono text-[10px] text-neutral-400 opacity-80 mt-2 truncate max-w-xs px-2">
              {WS_URL}
            </p>
          </div>
        )}
      </div>

      {/* Footer Dinâmico */}
      <div className={`flex items-center justify-between p-4 font-mono text-xs shrink-0 border-t transition-colors duration-300 ${
        isDark 
          ? 'border-neutral-800 bg-neutral-900/50' 
          : 'border-neutral-200 bg-neutral-50'
      }`}>
        <span className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {connected ? (
            <span className={isDark ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'}>
              {formatUptime(uptime)}{' '}
              <span className={`font-normal opacity-60 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>· online</span>
            </span>
          ) : (
            <span className={`opacity-80 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>--:--:-- · offline</span>
          )}
        </span>
        
        {/* BOTÃO COMPARTILHADO INTEGRADO AQUI */}
        <ExpandButton isMaximized={isMaximized} onClick={toggleMaximize} />
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