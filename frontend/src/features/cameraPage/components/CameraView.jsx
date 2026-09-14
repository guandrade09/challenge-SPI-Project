import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';
import { RiskAreaOverlay } from "../components/RiskAreaOverlay";
import { processWsStreamMessage } from '../../../utils/websocketStream';

const WS_URL = 'ws://127.0.0.1:8765';
const DEFAULT_TEST_FRAME = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="100%" height="100%" fill="%23121212"/><grid width="100%" height="100%" stroke="%23333" stroke-width="1"/><circle cx="640" cy="360" r="100" fill="none" stroke="%2300ff88" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2300ff88" font-family="monospace" font-size="28" font-weight="bold">FRAME DE TESTE CAM - SIMULAÇÃO LOCAL</text></svg>`;

const CORNER_CLASSES = [
  'top-2 left-2 border-t-2 border-l-2',
  'top-2 right-2 border-t-2 border-r-2',
  'bottom-2 left-2 border-b-2 border-l-2',
  'bottom-2 right-2 border-b-2 border-r-2',
];

export function CameraView({ 
  camera, 
  activeEpi, 
  onToggleMaximize,
  isEditingRiskArea,
  onNextCamera,
  onPrevCamera,
  totalCameras = 0,
  onExpand,
  onNextSlotCamera,
  onPrevSlotCamera
}) {
  const containerRef   = useRef(null);
  const imgRef         = useRef(null);
  const wsRef          = useRef(null);
  const reconnectRef   = useRef(null);
  const timeoutRef     = useRef(null);
  const lastImgUrlRef  = useRef(null);
  const cameraRef      = useRef(camera);

  if (camera) {
    cameraRef.current = camera;
  }

  const [connected, setConnected] = useState(false);
  const [useMockStream, setUseMockStream] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));

  const setRiskAreaForCamera = useCameraPresetsStore((s) => s.setRiskAreaForCamera);
  const getRiskAreaForCamera = useCameraPresetsStore((s) => s.getRiskAreaForCamera);

  const [riskBox, setRiskBox] = useState(() => {
    return getRiskAreaForCamera(camera?.id) || camera?.riskArea || null;
  });

  const handleToggleFullscreen = async () => {
    if (onToggleMaximize) onToggleMaximize();
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Erro ao alternar modo tela cheia:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('pt-BR')), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (camera?.id) {
      const savedRiskArea = getRiskAreaForCamera(camera.id) || camera.riskArea || null;
      setRiskBox(savedRiskArea);
    }
  }, [camera?.id]);

  const handleEnableMock = () => {
    setUseMockStream(true);
    if (imgRef.current) imgRef.current.src = DEFAULT_TEST_FRAME;
  };

  const handleSaveRiskBox = (newBox) => {
    setRiskBox(newBox);
    if (camera?.id) setRiskAreaForCamera(camera.id, newBox);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_risk_area', cameraId: camera?.id, riskArea: newBox }));
    }
  };

  useEffect(() => {
    function resetFrameTimeout() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setConnected(false);
        if (imgRef.current && !useMockStream) imgRef.current.src = '';
      }, 2500);
    }

    function connect() {
      if (wsRef.current) {
        const old = wsRef.current;
        old.onclose = null;
        if (old.readyState !== WebSocket.CONNECTING) old.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        try {
          if (event.data instanceof Blob) {
            const streamData = await processWsStreamMessage(event, cameraRef.current);
            if (streamData) {
              resetFrameTimeout();
              setConnected(true);
              if (imgRef.current) {
                if (lastImgUrlRef.current) URL.revokeObjectURL(lastImgUrlRef.current);
                lastImgUrlRef.current = streamData.imageUrl;
                imgRef.current.src = streamData.imageUrl;
              }
            }
            return;
          }
          const msg = JSON.parse(event.data);
          if (msg.setor && msg.setor !== cameraRef.current?.setor) return;
          const store = useMonitoramentoStore.getState();
          if (msg.type === 'alert') store.addAlerta(msg);
          else if (msg.type === 'detections') store.setLiveDetections(msg.data);
          else if (msg.type === 'pose') store.setLivePose(msg.pessoas ?? []);
          else if (msg.type === 'verdict') store.setVerdict(msg);
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [camera?.id]);

  const isStreamActive = connected || useMockStream;

  // Usa as setas do slot do grid se disponíveis, caso contrário usa a navegação global
  const handlePrev = onPrevSlotCamera || onPrevCamera;
  const handleNext = onNextSlotCamera || onNextCamera;

  // As setas de troca só devem ser exibidas se houver MAIS de 4 câmeras no total
  const showSlotArrows = totalCameras > 4 && handlePrev && handleNext;

  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col rounded border panel-base backdrop-blur-md overflow-hidden transition-all duration-300 shadow-2xl h-full ${
        isFullscreen ? 'bg-black p-0 border-none' : ''
      }`}
      style={{ borderColor: 'var(--p-subtext)' }}
    >
      <div className="flex-1 relative flex items-center justify-center bg-[var(--p-graf-bg)] overflow-hidden group min-h-[160px]">
        {CORNER_CLASSES.map((classes, i) => (
          <div key={i} className={`absolute w-3 h-3 z-20 pointer-events-none ${isStreamActive ? 'border-[var(--p-subtext)]' : 'border-[var(--p-border)]'} ${classes}`} />
        ))}

        {/* BARRA SUPERIOR DA CÂMERA */}
        <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
          <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-md border border-white/20 font-mono text-[10px] text-white uppercase tracking-wider truncate max-w-[65%] pointer-events-auto">
            {camera?.nome || 'CÂMERA'}
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1.5 rounded bg-black/80 hover:bg-emerald-600 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
                title="Expandir para Câmera Única"
              >
                <Expand className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* SETAS EXIBIDAS APENAS SE HOUVER MAIS DE 4 CÂMERAS CADASTRADAS */}
        {showSlotArrows && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 z-30 p-1.5 rounded bg-black/60 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Câmera Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 z-30 p-1.5 rounded bg-black/60 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Próxima Câmera"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        <img
          ref={imgRef}
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${isStreamActive ? 'opacity-100 block' : 'opacity-0 hidden'}`}
          alt=""
        />

        {isStreamActive && (
          <RiskAreaOverlay initialBox={riskBox} isEditing={isEditingRiskArea} onSaveBox={handleSaveRiskBox} />
        )}

        {!isStreamActive && (
          <div className="relative z-10 text-center select-none p-2 rounded bg-[var(--p-bg)] border border-[var(--p-border)] shadow-xl backdrop-blur-sm mx-2 flex flex-col items-center gap-1">
            <p className="font-mono text-[9px] font-bold tracking-widest text-[var(--p-text)] animate-pulse">SEM SINAL</p>
            <button onClick={handleEnableMock} className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold uppercase transition-all cursor-pointer">
              Simular
            </button>
          </div>
        )}

        <button 
          onClick={handleToggleFullscreen}
          className="absolute bottom-2 right-2 z-30 p-1.5 rounded bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
          title="Tela Cheia"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center justify-between px-2.5 py-1.5 font-mono text-[10px] shrink-0 border-t border-[var(--p-border)] bg-[var(--p-header-bg)]">
        <span className="font-bold text-[var(--p-subtext)] tracking-wider">{currentTime}</span>
        <span className={`w-2 h-2 rounded-full ${isStreamActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
      </div>
    </div>
  );
}

export default CameraView;