// src/features/monitoramentoPage/components/CameraView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Cpu } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';
import { ButtonAddCam } from '../../../features/monitoramentoPage/components/ButtonAddCam';
import { ButtonDeleteCam } from '../../../features/monitoramentoPage/components/ButtonDeleteCam';

const WS_URL = 'ws://localhost:8765';

const CORNER_CLASSES = [
  'top-4 left-4 border-t-2 border-l-2',
  'top-4 right-4 border-t-2 border-r-2',
  'bottom-4 left-4 border-b-2 border-l-2',
  'bottom-4 right-4 border-b-2 border-r-2',
];

export function CameraView({ 
  camera, 
  activeEpi, 
  theme = 'dynamic', 
  onAddCamera, 
  onDeleteCamera, 
  onToggleMaximize 
}) {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [uptime, setUptime] = useState(0);

  const addAlerta = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);

  // Conexão WebSocket para a câmera ativa
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
  }, [addAlerta, setLiveDetections, camera?.id]);

  // Contador de tempo online (Uptime)
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
    <div 
      className="w-full flex flex-col rounded-2xl border panel-base backdrop-blur-md overflow-hidden transition-all duration-300 shadow-2xl h-full"
      style={{ borderColor: 'var(--p-subtext)' }}
    >
      {/* Header do Card (Layout inspirado no Carousel) */}
      <div className="p-4 panel-header-base flex items-center justify-between border-b border-theme-divider shrink-0">
        <div className="flex items-center gap-2 max-w-[70%]">
          <span className="text-theme-title text-sm font-bold tracking-wider uppercase truncate">
            {`Câmera: ${camera?.nome || 'N/A'}`}
          </span>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-1.5 ml-2 w-52 shrink-0">
            <ButtonAddCam theme={theme} onAddCamera={onAddCamera} className="w-full justify-center" />
            <ButtonDeleteCam theme={theme} camera={camera} onDeleteCamera={onDeleteCamera} className="w-full justify-center" />
          </div>
        </div>

        <span className="text-theme-head animate-pulse text-[11px] px-2.5 py-1 rounded-md badge-theme-industrial shrink-0">
          {`Setor: ${camera?.setor || 'Geral'}`}
        </span>
      </div>

      {/* Body / Screen do Player CCTV */}
      <div className="flex-1 relative flex items-center justify-center bg-[var(--p-graf-bg)] overflow-hidden group min-h-[380px]">
        
        {/* Cantoneiras Táticas */}
        {CORNER_CLASSES.map((classes, i) => (
          <div 
            key={i} 
            className={`absolute w-5 h-5 z-20 pointer-events-none transition-colors duration-300 ${
              connected ? 'border-[var(--p-subtext)]' : 'border-[var(--p-border)]'
            } ${classes}`} 
          />
        ))}

        {/* Scanline Dinâmico */}
        {connected && (
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--p-subtext)] to-transparent z-20 pointer-events-none animate-[scanline_4s_linear_infinite]" />
        )}

        {/* Fundo de Grade sem sinal */}
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

        {/* Tag Overlay do Status de ML (Inspirado no Carousel) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          {activeEpi ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md bg-black/60 border border-[var(--p-subtext)] text-xs font-semibold uppercase tracking-wider text-theme-title shadow-lg">
              <Cpu size={14} className="animate-spin [animation-duration:3s] text-[var(--p-subtext)]" />
              <span>ML: DETECTANDO {activeEpi}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-theme-divider text-[10px] font-mono uppercase tracking-widest text-theme-head">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>AGUARDANDO SELEÇÃO DE IA</span>
            </div>
          )}
        </div>

        {/* Imagem do Streaming */}
        <img
          ref={imgRef}
          alt={`Câmera - ${camera?.nome}`}
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${
            connected ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {/* Mensagem de Sem Sinal */}
        {!connected && (
          <div className="relative z-10 text-center select-none p-6 rounded-xl bg-[var(--p-bg)] border border-[var(--p-border)] shadow-xl backdrop-blur-sm">
            <p className="font-mono text-xs font-bold tracking-widest text-[var(--p-text)] animate-pulse">
              SEM SINAL DE TRANSMISSÃO
            </p>
            <p className="font-mono text-[10px] text-[var(--p-text)] opacity-60 mt-2 truncate max-w-xs px-2">
              {camera?.ip || WS_URL}
            </p>
          </div>
        )}

        {/* Botão de Expandir / Maximizar */}
        <button 
          onClick={onToggleMaximize}
          className="absolute bottom-4 right-4 z-30 p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main hover:border-[var(--p-subtext)] opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95"
          title="Expandir Visualização"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Footer Unificado */}
      <div className="flex items-center justify-between p-3.5 font-mono text-xs shrink-0 border-t border-[var(--p-border)] bg-[var(--p-header-bg)] transition-colors duration-300">
        
        {/* Lado Esquerdo: Tempo de Transmissão */}
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

        {/* Lado Direito: Status de Conexão */}
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