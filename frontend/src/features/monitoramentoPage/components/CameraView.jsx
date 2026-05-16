import React, { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

const WS_URL = 'ws://localhost:8765';

// Cantoneiras usando classes nativas do Tailwind para evitar estilos Inline
const CORNER_CLASSES = [
  'top-4 left-4 border-t-2 border-l-2 border-neutral-800',
  'top-4 right-4 border-t-2 border-r-2 border-neutral-800',
  'bottom-4 left-4 border-b-2 border-l-2 border-neutral-800',
  'bottom-4 right-4 border-b-2 border-r-2 border-neutral-800',
];

export function CameraView() {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [uptime, setUptime] = useState(0);

  const addAlerta = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);

  // 1. Gerenciamento do WebSocket
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
          // Captura erros de parsing de JSON inválido silenciosamente
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

  // 2. Contador de Uptime Refatorado (Garante precisão sem mutar Refs manualmente)
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
    <div className="camera-container rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="camera-header flex items-center justify-between p-4 bg-neutral-950/40 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {['bg-red-500/80', 'bg-amber-500/80', 'bg-emerald-500/80'].map((bgClass, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${bgClass}`} />
            ))}
          </div>
          <span className="font-mono text-[11px] font-bold text-neutral-400 uppercase tracking-wider ml-1">
            câmera ao vivo
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
          <span 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              connected 
                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse' 
                : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
            }`} 
          />
          <span className={connected ? 'text-emerald-400' : 'text-amber-500'}>
            {connected ? 'conectado' : 'aguardando'}
          </span>
        </div>
      </div>

      {/* Feed da Câmera */}
      <div className="relative flex items-center justify-center h-[520px] bg-neutral-950 overflow-hidden">
        {/* Cantoneiras de Foco */}
        {CORNER_CLASSES.map((classes, i) => (
          <div key={i} className={`absolute w-5 h-5 z-10 pointer-events-none ${classes}`} />
        ))}

        {/* Linha de Scanner Animada */}
        {connected && (
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent z-20 pointer-events-none animate-[scanline_4s_linear_infinite]" />
        )}

        {/* Fundo de Linhas de Grade/Xadrez (Modo Offline) */}
        {!connected && (
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #16161a 25%, transparent 25%), 
                linear-gradient(-45deg, #16161a 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #16161a 75%), 
                linear-gradient(-45deg, transparent 75%, #16161a 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
            }}
          />
        )}

        {/* Imagem do Streaming */}
        <img
          ref={imgRef}
          alt="Grower IA Stream"
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${
            connected ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {/* Placeholder Sem Sinal */}
        {!connected && (
          <div className="relative z-10 text-center select-none bg-neutral-900/60 p-6 rounded-xl border border-neutral-800/40 backdrop-blur-sm">
            <p className="font-mono text-xs font-bold tracking-widest text-neutral-500 animate-pulse">
              SEM SINAL TRANSMISSÃO
            </p>
            <p className="font-mono text-[11px] text-neutral-600 mt-2 truncate max-w-xs px-2">
              {WS_URL}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Trailer */}
      <div className="camera-trailer flex items-center justify-between p-4 bg-neutral-950/20 border-t border-neutral-800/40 font-mono text-xs">
        <span className="text-neutral-500">
          {connected ? (
            <span className="text-emerald-500/80">{formatUptime(uptime)} <span className="text-neutral-600">· online</span></span>
          ) : (
            '--:--:-- · offline'
          )}
        </span>
        <button className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Injeção de Keyframes usando a sintaxe clássica do Tailwind ou escopo global */}
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