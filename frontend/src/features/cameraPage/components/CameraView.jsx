import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Cpu } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore'; // 1. IMPORTAR A STORE DE PRESETS
import { ButtonAddCam } from '../../../features/monitoramentoPage/components/ButtonAddCam';
import { ButtonDeleteCam } from '../../../features/monitoramentoPage/components/ButtonDeleteCam';
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
  theme = 'dynamic', 
  onAddCamera, 
  onDeleteCamera, 
  onToggleMaximize,
  isEditingRiskArea,
  setIsEditingRiskArea
}) {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [useMockStream, setUseMockStream] = useState(false);

  // 2. BUSCAR Métodos da Store de Presets
  const setRiskAreaForCamera = useCameraPresetsStore((s) => s.setRiskAreaForCamera);
  const clearRiskAreaForCamera = useCameraPresetsStore((s) => s.clearRiskAreaForCamera);
  const getRiskAreaForCamera = useCameraPresetsStore((s) => s.getRiskAreaForCamera);

  // 3. Inicializa a área de risco buscando primeiro dos presets persistidos, depois da prop camera
  const [riskBox, setRiskBox] = useState(() => {
    return getRiskAreaForCamera(camera?.id) || camera?.riskArea || null;
  });

  const addAlerta = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);

  // Sincroniza quando a câmera selecionada mudar
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

  // 4. Salva no estado local E grava na Store Persistida
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

  // 5. Deleta no estado local E remove da Store Persistida
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

  useEffect(() => {
    if (!connected && !useMockStream) {
      setUptime(0);
      return;
    }
    const id = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [connected, useMockStream]);

  const formatUptime = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isStreamActive = connected || useMockStream;

  return (
    <div 
      className="w-full flex flex-col rounded-2xl border panel-base backdrop-blur-md overflow-hidden transition-all duration-300 shadow-2xl h-full"
      style={{ borderColor: 'var(--p-subtext)' }}
    >
      {/* Header */}
      <div className="p-2.5 sm:p-4 panel-header-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-theme-divider shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <span className="text-theme-title text-xs sm:text-sm font-bold tracking-wider uppercase truncate max-w-[200px] sm:max-w-xs">
            {`Câmera: ${camera?.nome || 'N/A'}`}
          </span>

          <span className="text-theme-head sm:hidden text-[9px] px-2 py-0.5 rounded-md badge-theme-industrial shrink-0 font-mono">
            {camera?.setor || 'Geral'}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="grid grid-cols-2 gap-1.5 w-full sm:w-48 shrink-0">
            <ButtonAddCam theme={theme} onAddCamera={onAddCamera} className="w-full justify-center text-xs py-1" />
            <ButtonDeleteCam theme={theme} camera={camera} onDeleteCamera={onDeleteCamera} className="w-full justify-center text-xs py-1" />
          </div>

          <span className="hidden sm:inline-block text-theme-head animate-pulse text-[11px] px-2.5 py-1 rounded-md badge-theme-industrial shrink-0 font-mono">
            {`Setor: ${camera?.setor || 'Geral'}`}
          </span>
        </div>
      </div>

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

      {/* Footer */}
      <div className="flex items-center justify-between p-2.5 sm:p-3.5 font-mono text-[10px] sm:text-xs shrink-0 border-t border-[var(--p-border)] bg-[var(--p-header-bg)] transition-colors duration-300">
        <span className="font-medium text-[var(--p-text)]">
          {isStreamActive ? (
            <span className="text-[var(--p-subtext)] font-bold">
              {formatUptime(uptime)}{' '}
              <span className="font-normal opacity-60 text-[var(--p-text)] hidden sm:inline">
                · {connected ? 'servidor ws' : 'simulado'}
              </span>
            </span>
          ) : (
            <span className="opacity-60 text-[var(--p-text)]">--:--:--</span>
          )}
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