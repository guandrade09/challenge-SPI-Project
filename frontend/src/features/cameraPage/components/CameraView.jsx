import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Cpu } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';
import { RiskAreaOverlay } from "../components/RiskAreaOverlay";

const WS_URL = 'ws://localhost:8765';

const DEFAULT_TEST_FRAME = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="100%" height="100%" fill="%23121212"/><grid width="100%" height="100%" stroke="%23333" stroke-width="1"/><circle cx="640" cy="360" r="100" fill="none" stroke="%2300ff88" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2300ff88" font-family="monospace" font-size="28" font-weight="bold">FRAME DE TESTE CAM - SIMULAÇÃO LOCAL</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23888888" font-family="monospace" font-size="18">Desenhe a Área de Risco sobre este quadro</text></svg>`;

const CORNER_CLASSES = [
  'top-2 left-2 sm:top-4 sm:left-4 border-t-2 border-l-2',
  'top-2 right-2 sm:top-4 sm:right-4 border-t-2 border-r-2',
  'bottom-2 left-2 sm:bottom-4 sm:left-4 border-b-2 border-l-2',
  'bottom-2 right-2 sm:bottom-4 sm:right-4 border-b-2 border-r-2',
];

export function CameraView({ 
  camera, 
  activeEpi, 
  onToggleMaximize,
  isEditingRiskArea
}) {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [useMockStream, setUseMockStream] = useState(false);

  // ESTADO PARA O RELÓGIO EM TEMPO REAL
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));

  // Store de Presets
  const setRiskAreaForCamera = useCameraPresetsStore((s) => s.setRiskAreaForCamera);
  const clearRiskAreaForCamera = useCameraPresetsStore((s) => s.clearRiskAreaForCamera);
  const getRiskAreaForCamera = useCameraPresetsStore((s) => s.getRiskAreaForCamera);

  // Inicializa a área de risco
  const [riskBox, setRiskBox] = useState(() => {
    return getRiskAreaForCamera(camera?.id) || camera?.riskArea || null;
  });

  const addAlerta = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);

  // RELÓGIO EM TEMPO REAL (Atualiza a cada 1 segundo)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sincroniza quando a câmera mudar
  useEffect(() => {
    if (camera?.id) {
      const savedRiskArea = getRiskAreaForCamera(camera.id) || camera.riskArea || null;
      setRiskBox(savedRiskArea);
    }
  }, [camera?.id]);

  useEffect(() => {
    const handleClearEvent = () => handleDeleteRiskBox();
    window.addEventListener('clear_risk_area', handleClearEvent);
    return () => window.removeEventListener('clear_risk_area', handleClearEvent);
  }, [camera?.id]);

  const handleEnableMock = () => {
    setUseMockStream(true);
    if (imgRef.current) {
      imgRef.current.src = DEFAULT_TEST_FRAME;
    }
  };

  const handleSaveRiskBox = (newBox) => {
    setRiskBox(newBox);
    
    if (camera?.id) {
      setRiskAreaForCamera(camera.id, newBox);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'set_risk_area',
        cameraId: camera?.id,
        riskArea: newBox
      }));
    }
  };

  const handleDeleteRiskBox = () => {
    setRiskBox(null);

    if (camera?.id) {
      clearRiskAreaForCamera(camera.id);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'clear_risk_area',
        cameraId: camera?.id
      }));
    }
  };

  useEffect(() => {
    function connect() {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setUseMockStream(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'frame' && imgRef.current) {
            imgRef.current.src = msg.data.startsWith('data:') 
              ? msg.data 
              : `data:image/svg+xml;base64,${msg.data}`;
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
        if (imgRef.current && !useMockStream) imgRef.current.src = '';
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

  const isStreamActive = connected || useMockStream;

  return (
    <div 
      className="w-full flex flex-col rounded-2xl border panel-base backdrop-blur-md overflow-hidden transition-all duration-300 shadow-2xl h-full"
      style={{ borderColor: 'var(--p-subtext)' }}
    >
      {/* Screen */}
      <div className="flex-1 relative flex items-center justify-center bg-[var(--p-graf-bg)] overflow-hidden group min-h-[220px] sm:min-h-[380px]">
        {CORNER_CLASSES.map((classes, i) => (
          <div 
            key={i} 
            className={`absolute w-3 h-3 sm:w-5 sm:h-5 z-20 pointer-events-none transition-colors duration-300 ${
              isStreamActive ? 'border-[var(--p-subtext)]' : 'border-[var(--p-border)]'
            } ${classes}`} 
          />
        ))}

        {isStreamActive && (
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--p-subtext)] to-transparent z-20 pointer-events-none animate-[scanline_4s_linear_infinite]" />
        )}

        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-max max-w-[90%]">
          {activeEpi ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-md bg-black/60 border border-[var(--p-subtext)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-theme-title shadow-lg truncate">
              <Cpu size={12} className="animate-spin [animation-duration:3s] text-[var(--p-subtext)] shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">ML: DETECTANDO {activeEpi}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-md bg-black/40 border border-theme-divider text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-theme-head">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>AGUARDANDO IA</span>
            </div>
          )}
        </div>

        <img
          ref={imgRef}
          alt={`Câmera - ${camera?.nome}`}
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${
            isStreamActive ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        />

        {isStreamActive && (
          <RiskAreaOverlay
            initialBox={riskBox}
            isEditing={isEditingRiskArea}
            onSaveBox={handleSaveRiskBox}
          />
        )}

        {!isStreamActive && (
          <div className="relative z-10 text-center select-none p-4 sm:p-6 rounded-xl bg-[var(--p-bg)] border border-[var(--p-border)] shadow-xl backdrop-blur-sm mx-4 flex flex-col items-center gap-3">
            <p className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-[var(--p-text)] animate-pulse">
              SEM SINAL DE TRANSMISSÃO
            </p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[var(--p-text)] opacity-60 truncate max-w-[200px] sm:max-w-xs">
              {camera?.ip || WS_URL}
            </p>

            <button
              onClick={handleEnableMock}
              className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer z-40"
            >
              Simular Câmera no Navegador
            </button>
          </div>
        )}

        <button 
          onClick={onToggleMaximize}
          className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-30 p-2 sm:p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main hover:border-[var(--p-subtext)] opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95"
          title="Expandir Visualização"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Footer com Hora em Tempo Real */}
      <div className="flex items-center justify-between p-2.5 sm:p-3.5 font-mono text-[10px] sm:text-xs shrink-0 border-t border-[var(--p-border)] bg-[var(--p-header-bg)] transition-colors duration-300">
        <span className="font-bold text-[var(--p-subtext)] tracking-wider">
          {currentTime}{' '}
          <span className="font-normal opacity-60 text-[var(--p-text)] hidden sm:inline">
            · {connected ? 'servidor ws' : useMockStream ? 'simulado' : 'offline'}
          </span>
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-wide select-none">
          <span 
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
              isStreamActive 
                ? 'bg-[var(--p-subtext)] shadow-[0_0_10px_var(--p-subtext)] animate-pulse' 
                : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
            }`} 
          />
          <span className={isStreamActive ? 'text-[var(--p-subtext)] font-bold' : 'text-amber-500 font-bold'}>
            {connected ? 'conectado' : useMockStream ? 'simulado' : 'aguardando'}
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