import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Eye, EyeOff, LayoutGrid, Square, RefreshCw } from 'lucide-react';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';
import { makeStreamKey, useCameraStreamStore } from '../../../store/useCameraStreamStore';
import { cameraSocketManager } from '../../../services/websocket/CameraSocketManager';
import { RiskAreaOverlay } from "../components/RiskAreaOverlay";
import { DetectionsOverlay } from "../components/DetectionsOverlay";

const DEFAULT_TEST_FRAME = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="100%" height="100%" fill="%23121212"/><grid width="100%" height="100%" stroke="%23333" stroke-width="1"/><circle cx="640" cy="360" r="100" fill="none" stroke="%2300ff88" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2300ff88" font-family="monospace" font-size="28" font-weight="bold">FRAME DE TESTE CAM - SIMULAÇÃO LOCAL</text></svg>`;

const CORNER_CLASSES = [
  'top-2 left-2 border-t-2 border-l-2',
  'top-2 right-2 border-t-2 border-r-2',
  'bottom-2 left-2 border-b-2 border-l-2',
  'bottom-2 right-2 border-b-2 border-r-2',
];

export function CameraView({
  camera,
  onToggleMaximize,
  isEditingRiskArea,
  onNextCamera,
  onPrevCamera,
  totalCameras = 0,
  onExpand,
  layoutMode,
  setLayoutMode,
  onNextSlotCamera,
  onPrevSlotCamera,
  showDetections = true,
  onToggleDetections,
}) {
  const containerRef = useRef(null);

  const [useMockStream, setUseMockStream] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [reconnectError, setReconnectError] = useState('');

  const setRiskAreaForCamera = useCameraPresetsStore((s) => s.setRiskAreaForCamera);
  const riskBox = useCameraPresetsStore((s) =>
    camera?.id ? s.presets[camera.id]?.riskArea || camera?.riskArea || null : null
  );

  // ── Conexão: assina o gerenciador único de WebSocket (não abre socket próprio) ──
  useEffect(() => {
    cameraSocketManager.subscribe();
    return () => cameraSocketManager.unsubscribe();
  }, []);

  // chave desta câmera específica no stream compartilhado
  const setor  = camera?.setor;
  const source = camera?.papel || 'frontal'; // 'frontal' | 'lateral'
  const cameraId = camera?.id;
  const streamKey = makeStreamKey(cameraId, setor, source);

  const frameUrl  = useCameraStreamStore((s) => s.getFrame(cameraId, setor, source));
  const wsConnected = useCameraStreamStore((s) => s.connected);
  const streamStatus = useCameraStreamStore((s) => s.streamStatus[streamKey]);
  // resolução real do frame (vem no cabeçalho de cada frame) — necessária para mapear a
  // área de risco no espaço da imagem, já que o <img> usa object-cover (escala + crop).
  // Seletores primitivos: o objeto de meta muda a cada frame.
  const metaWidth  = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, source)?.width);
  const metaHeight = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, source)?.height);
  // disponíveis para painéis irmãos (AlertPanel/DetectionPanel) lerem pelo mesmo setor;
  // aqui só usamos o que o próprio card precisa renderizar
  // const pose = useCameraStreamStore((s) => s.pose[setor]?.[source] ?? []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('pt-BR')), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleFullscreen = async () => {
    if (onToggleMaximize) onToggleMaximize();
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Erro ao alternar modo tela cheia:", err);
    }
  };

  const handleEnableMock = () => setUseMockStream(true);
  const isReconnecting = streamStatus?.status === 'reconnecting';

  const handleReconnect = async () => {
    if (cameraId === null || cameraId === undefined || isReconnecting) return;
    setReconnectError('');
    try {
      await cameraSocketManager.reconnectStream({ cameraId, setor, source });
    } catch (error) {
      setReconnectError(error.message || 'Não foi possível solicitar a reconexão.');
    }
  };

  const handleSaveRiskBox = useCallback(async (newBox) => {
    const previousBox = riskBox;
    if (cameraId) setRiskAreaForCamera(cameraId, newBox);
    try {
      await cameraSocketManager.sendRequest({
        type: 'set_risk_area', cameraId, setor, source, riskArea: newBox,
      });
    } catch (error) {
      if (cameraId) setRiskAreaForCamera(cameraId, previousBox);
      console.warn('Não foi possível atualizar a área de risco:', error);
    }
  }, [cameraId, riskBox, setor, setRiskAreaForCamera, source]);

  // fonte real do stream (mock tem prioridade só quando ativado manualmente)
  const displaySrc = useMockStream ? DEFAULT_TEST_FRAME : (frameUrl || null);
  const isStreamActive = useMockStream || (!!frameUrl && wsConnected);

  const handlePrev = onPrevSlotCamera || onPrevCamera;
  const handleNext = onNextSlotCamera || onNextCamera;
  const showSlotArrows = totalCameras > 1 && handlePrev && handleNext;

  const handleToggleLayout = () => {
    if (layoutMode === "grid2x2" && onExpand) {
      onExpand();
    } else if (setLayoutMode) {
      setLayoutMode(layoutMode === 'single' ? 'grid2x2' : 'single');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col bg-neutral-950 overflow-hidden relative ${
        isFullscreen ? 'bg-black p-0 border-none' : ''
      }`}
    >
      <div className="flex-1 relative flex items-center justify-center bg-[var(--p-graf-bg)] overflow-hidden group min-h-0 w-full">
        {CORNER_CLASSES.map((classes, i) => (
          <div key={i} className={`absolute w-3 h-3 z-20 pointer-events-none ${isStreamActive ? 'border-[var(--p-subtext)]' : 'border-[var(--p-border)]'} ${classes}`} />
        ))}

        <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
          <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-md border border-white/20 font-mono text-[10px] text-white uppercase tracking-wider truncate max-w-[65%] pointer-events-auto">
            {camera?.nome || 'CÂMERA'}
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {onToggleDetections && (
              <button
                type="button"
                onClick={() => onToggleDetections(cameraId)}
                aria-pressed={showDetections}
                className={`p-1.5 rounded bg-black/80 hover:bg-emerald-600 text-white border backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg ${showDetections ? 'border-emerald-400/60' : 'border-white/20'}`}
                title={showDetections ? 'Ocultar detecções' : 'Exibir detecções'}
              >
                {showDetections
                  ? <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  : <EyeOff className="w-3.5 h-3.5 text-white/70" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleLayout}
              className="p-1.5 rounded bg-black/80 hover:bg-emerald-600 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg flex items-center gap-1"
              title={layoutMode === 'single' ? "Alternar para Modo Grade (2x2)" : "Alternar para Câmera Única"}
            >
              {layoutMode === 'single' ? (
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
              ) : (
                <Square className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
              )}
            </button>
          </div>
        </div>

        {showSlotArrows && (
          <>
            <button type="button" onClick={handlePrev} className="absolute left-2 z-30 p-1.5 rounded bg-black/60 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" title="Câmera Anterior">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleNext} className="absolute right-2 z-30 p-1.5 rounded bg-black/60 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" title="Próxima Câmera">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {isStreamActive && displaySrc ? (
          <img
            key={`${cameraId}:${setor}:${source}`}
            src={displaySrc}
            className="w-full h-full object-cover select-none transition-opacity duration-300 opacity-100 block"
            alt=""
          />
        ) : null}

        {isStreamActive && (
          <>
            {showDetections && <DetectionsOverlay cameraId={cameraId} setor={setor} source={source} />}
            <RiskAreaOverlay
              initialBox={riskBox}
              isEditing={isEditingRiskArea}
              onSaveBox={handleSaveRiskBox}
              frameWidth={useMockStream ? 1280 : (metaWidth || null)}
              frameHeight={useMockStream ? 720 : (metaHeight || null)}
            />
          </>
        )}

        {!isStreamActive && (
          <div className="relative z-10 text-center select-none p-3 rounded bg-[var(--p-bg)] border border-[var(--p-border)] shadow-xl backdrop-blur-sm mx-2 flex flex-col items-center gap-2">
            <p className="font-mono text-[9px] font-bold tracking-widest text-[var(--p-text)]">
              {isReconnecting ? 'RECONECTANDO...' : 'SEM SINAL'}
            </p>
            <button
              type="button"
              onClick={handleReconnect}
              disabled={!wsConnected || isReconnecting}
              className="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-400 text-white font-mono text-[10px] font-bold uppercase transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
              Tentar conexão novamente
            </button>
            <button onClick={handleEnableMock} className="text-[9px] font-mono text-[var(--p-subtext)] hover:text-emerald-400 cursor-pointer underline underline-offset-2">
              Usar simulação
            </button>
            {reconnectError && <p className="max-w-56 text-[9px] text-red-400">{reconnectError}</p>}
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
