import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';
import { RiskAreaOverlay } from "../components/RiskAreaOverlay";

const WS_URL = 'ws://127.0.0.1:8765';

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
  isEditingRiskArea,
  onNextCamera,      // NOVO: Navegação
  onPrevCamera,      // NOVO: Navegação
  totalCameras = 0   // NOVO: Contador
}) {
  const containerRef   = useRef(null);
  const imgRef         = useRef(null);
  const wsRef          = useRef(null);
  const reconnectRef   = useRef(null);
  const lastImgUrlRef  = useRef(null);
  const cameraRef      = useRef(camera);
  if (camera) {
    if (cameraRef.current?.id !== camera.id || cameraRef.current?.papel !== camera.papel) {
      console.log(`[CAM] troca: ${cameraRef.current?.nome}(${cameraRef.current?.papel}) → ${camera?.nome}(${camera?.papel}) | setor=${camera?.setor}`);
    }
    cameraRef.current = camera;
  }

  const [connected, setConnected] = useState(false);
  const [useMockStream, setUseMockStream] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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


  // GERENCIADOR DE TELA CHEIA (Fullscreen API)
  const handleToggleFullscreen = async () => {
    if (onToggleMaximize) {
      onToggleMaximize();
    }

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

  // Monitora mudanças no estado de Tela Cheia do Navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // RELÓGIO EM TEMPO REAL
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

  // Limpa imagem ao trocar de câmera
  // Se o setor não mudou, o WS continua vivo — não derruba o connected
  const prevSetorRef = useRef(camera?.setor);
  useEffect(() => {
    const setorMudou = prevSetorRef.current !== camera?.setor;
    prevSetorRef.current = camera?.setor;
    console.log(`[CAM] id mudou → id=${camera?.id} nome=${camera?.nome} papel=${camera?.papel} setor=${camera?.setor} setorMudou=${setorMudou}`);
    if (setorMudou) setConnected(false);
    if (imgRef.current) imgRef.current.src = '';
    if (lastImgUrlRef.current) { URL.revokeObjectURL(lastImgUrlRef.current); lastImgUrlRef.current = null; }
  }, [camera?.id]);

  useEffect(() => {
    function connect() {
      if (wsRef.current) {
        const old = wsRef.current;
        old.onclose = null;
        if (old.readyState !== WebSocket.CONNECTING) old.close();
        else old.onopen = () => old.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WS] conectado | camera="${camera?.nome}" setor="${camera?.setor}"`);
        setConnected(true);
        setUseMockStream(false);
      };

      ws.onmessage = async (event) => {
        try {
          // Frame binário: header JSON + \n + JPEG bytes
          if (event.data instanceof Blob) {
            const ab = await event.data.arrayBuffer();
            const bytes = new Uint8Array(ab);
            const nl = bytes.indexOf(10);
            if (nl === -1) return;
            const header = JSON.parse(new TextDecoder().decode(bytes.subarray(0, nl)));
            if (header.type !== 'frame') return;
            const cam = cameraRef.current;
            if (header.setor !== cam?.setor) return;
            const expectedSource = cam?.papel ?? 'frontal';
            console.log(`[FRAME] chegou source="${header.source}" | esperado="${expectedSource}" (${cam?.nome}) | aceito=${header.source === expectedSource}`);
            if (header.source !== expectedSource) return;
            setConnected(true);

            if (imgRef.current) {
              const jpegBlob = new Blob([bytes.subarray(nl + 1)], { type: 'image/jpeg' });
              if (lastImgUrlRef.current) URL.revokeObjectURL(lastImgUrlRef.current);
              lastImgUrlRef.current = URL.createObjectURL(jpegBlob);
              imgRef.current.src = lastImgUrlRef.current;
            }
            return;
          }

          // Mensagens JSON (alert, detections, pose, verdict…)
          const msg = JSON.parse(event.data);
          if (msg.setor && msg.setor !== cameraRef.current?.setor) return;
          const store = useMonitoramentoStore.getState();
          if (msg.type === 'alert') {
            store.addAlerta(msg);
          } else if (msg.type === 'detections') {
            store.setLiveDetections(msg.data);
          } else if (msg.type === 'pose') {
            store.setLivePose(msg.pessoas ?? []);
          } else if (msg.type === 'verdict') {
            store.setVerdict(msg);
          }
        } catch {
          // Fail-silent
        }
      };

      ws.onerror = (e) => {
        console.error(`[WS] erro | camera="${camera?.nome}" readyState=${ws.readyState}`, e);
      };

      ws.onclose = (e) => {
        console.warn(`[WS] fechou | camera="${camera?.nome}" code=${e.code} wasClean=${e.wasClean}`);
        setConnected(false);
        if (imgRef.current && !useMockStream) imgRef.current.src = '';
        if (lastImgUrlRef.current) { URL.revokeObjectURL(lastImgUrlRef.current); lastImgUrlRef.current = null; }
        reconnectRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      const wsToClose = wsRef.current;
      if (wsToClose) {
        wsToClose.onclose = null;
        if (wsToClose.readyState !== WebSocket.CONNECTING) wsToClose.close();
        else wsToClose.onopen = () => wsToClose.close();
      }
    };
  }, [camera?.setor]);

  const isStreamActive = connected || useMockStream;

  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col rounded-2xl border panel-base backdrop-blur-md overflow-hidden transition-all duration-300 shadow-2xl h-full ${
        isFullscreen ? 'bg-black p-0 border-none rounded-none' : ''
      }`}
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

        {/* NOME DA CÂMERA EM FULLSCREEN */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 font-mono text-xs text-white uppercase tracking-wider">
            {camera?.nome || 'CÂMERA'}
          </div>
        )}

        {/* inset-x-0 + flex justify-center em vez de left-1/2 -translate-x-1/2: nesse
            projeto o -translate-x-1/2 do Tailwind v4 não aplica (mesmo bug já visto no
            AiChatSidebar) — o badge fica deslocado pra direita em vez de centralizado. */}
        <div className="absolute top-2 sm:top-4 inset-x-0 flex justify-center z-30 pointer-events-none px-2">
          {activeEpi ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-md bg-black/60 border border-[var(--p-subtext)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider font-theme-title text-[var(--p-text-title)] shadow-lg truncate max-w-[90vw]">
              <Cpu size={12} className="animate-spin [animation-duration:3s] text-[var(--p-subtext)] shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">ML: DETECTANDO {activeEpi}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-md bg-black/60 border border-[var(--p-subtext)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider font-theme-title text-[var(--p-text-title)] shadow-lg truncate max-w-[90vw]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="truncate">AGUARDANDO SELEÇÃO DE EPI</span>
            </div>
          )}
        </div>

        {/* CONTROLES DE TROCA DE CÂMERA (FLUTUANTES) */}
        {totalCameras > 1 && (
          <div className={`absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-5 pointer-events-none z-30 transition-opacity duration-300 ${
            isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <button
              type="button"
              onClick={onPrevCamera}
              className="pointer-events-auto p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white shadow-xl backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              title="Câmera Anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              type="button"
              onClick={onNextCamera}
              className="pointer-events-auto p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white shadow-xl backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              title="Próxima Câmera"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}

        <img
          ref={imgRef}
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

        {/* Botão de Fullscreen */}
        <button 
          onClick={handleToggleFullscreen}
          className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-30 p-2 sm:p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main hover:border-[var(--p-subtext)] opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95 cursor-pointer"
          title={isFullscreen ? "Sair da Tela Cheia" : "Expandir Visualização"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
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