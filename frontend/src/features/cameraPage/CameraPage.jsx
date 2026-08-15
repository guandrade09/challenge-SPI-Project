import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

// Componentes
import { CameraView, DetectionPanel, AlertPanel } from './components';
import { CameraMosaicGrid } from './components/CameraMosaicGrid';
import { MonitoramentoSkeleton } from './components/MonitoramentoSkeleton';
import ButtonAddCam from './components/ButtonAddCam';

// Stores & Enums
import { PANEL_STATUS } from '../../enums/enums';
import { useCameraStore } from '../../store/useCameraStore';
import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';
import { useUiStore } from '../../store/useUiStore';

const EMPTY_ARRAY = [];

const DETECTION_CONFIG = [
  { id: 'colete',   label: 'Detectar Colete'   },
  { id: 'oculos',   label: 'Detectar Óculos'   },
  { id: 'capacete', label: 'Detectar Capacete' },
  { id: 'mascara',  label: 'Detectar Máscara'  },
];

const LABEL_PT = {
  'Hardhat':        'Capacete',
  'Safety Vest':    'Colete',
  'Goggles':        'Óculos',
  'Mask':           'Máscara',
  'NO-Hardhat':     'Sem Capacete',
  'NO-Safety Vest': 'Sem Colete',
  'NO-Goggles':     'Sem Óculos',
  'NO-Mask':        'Sem Máscara',
};

const RISK_LABELS = new Set(['NO-Hardhat', 'NO-Safety Vest', 'NO-Goggles', 'NO-Mask', 'NO-Gloves']);

const formatDetection = (d) => {
  const icon = RISK_LABELS.has(d.label) ? '⚠' : '✓';
  return `${icon} ${LABEL_PT[d.label] ?? d.label} — ${(d.confidence * 100).toFixed(0)}%`;
};

export const CameraPage = () => {
  const currentTheme = useUiStore((s) => s.theme);
  
  const cameras = useCameraStore((state) => state.cameras);
  const isLoading = useCameraStore((state) => state.isLoading);
  const fetchCameras = useCameraStore((state) => state.fetchCameras);
  const addCamera = useCameraStore((state) => state.addCamera);
  const deleteCamera = useCameraStore((state) => state.deleteCamera);

  const removePresetForCamera = useCameraPresetsStore((state) => state.removePresetForCamera);

  const { alertaAtivo, limparAlertaAtivo, liveDetections } = useMonitoramentoStore();

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  useEffect(() => {
    if (!alertaAtivo) return;
    const timer = setTimeout(limparAlertaAtivo, 10000);
    return () => clearTimeout(timer);
  }, [alertaAtivo, limparAlertaAtivo]);

  const currentCamera = cameras[currentIndex] || cameras[0];
  const currentCameraId = currentCamera?.id;

  const activeEpisForVisuals = useCameraPresetsStore(
    useShallow((state) => {
      if (!currentCameraId) return EMPTY_ARRAY;
      const data = state.presets[currentCameraId];
      return Array.isArray(data) ? data : EMPTY_ARRAY;
    })
  );

  useEffect(() => {
    if (!currentCameraId) return;

    const novoEstadoDetections = {
      colete: false, oculos: false, capacete: false, mascara: false, luvas: false,
    };

    activeEpisForVisuals.forEach((epi) => {
      if (novoEstadoDetections[epi] !== undefined) {
        novoEstadoDetections[epi] = true;
      }
    });

    useMonitoramentoStore.setState({ detections: novoEstadoDetections });
  }, [currentCameraId, activeEpisForVisuals]);

  // Handler para troca direta através do Mosaico
  const handleSelectCamera = (index) => {
    if (index >= 0 && index < cameras.length) {
      setCurrentIndex(index);
    }
  };

  const handleNextCamera = () => {
    if (cameras.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % cameras.length);
  };

  const handlePrevCamera = () => {
    if (cameras.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + cameras.length) % cameras.length);
  };

  const handleAddCamera = async (newCamData) => {
    try {
      await addCamera(newCamData);
      const updatedCameras = useCameraStore.getState().cameras;
      setCurrentIndex(Math.max(0, updatedCameras.length - 1));
    } catch (err) {
      console.error("Falha ao salvar câmera:", err);
    }
  };

  const handleDeleteCamera = async (idToDelete) => {
    try {
      const deletedIndex = cameras.findIndex((cam) => cam.id === idToDelete);

      await deleteCamera(idToDelete);
      removePresetForCamera(idToDelete);

      const updatedCameras = useCameraStore.getState().cameras;
      const remainingCount = updatedCameras.length;

      if (remainingCount === 0) {
        setCurrentIndex(0);
      } else if (deletedIndex >= remainingCount) {
        setCurrentIndex(remainingCount - 1);
      } else {
        setCurrentIndex(deletedIndex);
      }
    } catch (err) {
      console.error("Falha ao deletar câmera:", err);
    }
  };

  const buildMessage = () => {
    if (alertaAtivo) {
      return `⚠ ${LABEL_PT[alertaAtivo.label] ?? alertaAtivo.label} — confiança: ${(alertaAtivo.confidence * 100).toFixed(0)}%`;
    }
    if (liveDetections.length === 0) {
      return 'Aguardando detecções...';
    }
    const linhas = liveDetections
      .filter((d) => LABEL_PT[d.label])
      .map(formatDetection);
    return linhas.length > 0 ? linhas.join('\n') : 'Nenhum EPI no frame.';
  };

  const activeEpiName = activeEpisForVisuals.length > 0
    ? activeEpisForVisuals.join(', ').toUpperCase()
    : null;

  const panelStatus = alertaAtivo
    ? PANEL_STATUS.ALERTA
    : liveDetections.length > 0
      ? PANEL_STATUS.ATENCAO
      : PANEL_STATUS.PRONTO;

  const isDark = currentTheme === 'dark';

  if (isLoading && cameras.length === 0) {
    return <MonitoramentoSkeleton theme={currentTheme} />;
  }

  if (!isLoading && cameras.length === 0) {
    return (
      <div className={`panel-theme-${currentTheme} min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 ${isDark ? 'dark' : 'light'}`}>
        <h2 className="text-xl text-theme-title tracking-wider">Nenhuma câmera cadastrada</h2>
        <p className="text-theme-main tracking-wider">Cadastre sua primeira câmera para iniciar o monitoramento.</p>
        
        <div className="pt-4">
          <ButtonAddCam 
            theme={currentTheme} 
            onAddCamera={handleAddCamera} 
            variant="full"
            colorVariant="default"
            label="Adicionar Câmera"
            className="icon-btn-success max-w-[300px] gap-2"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300 text-theme-title ${isDark ? 'dark' : 'light'}`}>
      <div className="mx-auto p-3 md:p-5 max-w-[1800px] w-full">
        
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LADO ESQUERDO: CÂMERA PRINCIPAL (9 COLUNAS) + MOSAICO LOGO ABAIXO */}
          <div className="lg:col-span-9 flex flex-col w-full gap-4">
            
            {/* Player Central */}
            <div className="relative w-full h-[calc(100vh-220px)] min-h-[520px] flex items-center justify-center">
              {cameras.length > 1 && (
                <button 
                  onClick={handlePrevCamera}
                  className="absolute left-4 z-40 p-3 rounded-xl bg-[var(--p-header-bg)] border border-theme-divider text-theme-main hover:border-[var(--p-subtext)] transition-all active:scale-95 backdrop-blur-md shadow-2xl"
                  title="Câmera Anterior"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              <CameraView 
                camera={currentCamera}
                activeEpi={activeEpiName}
                theme={currentTheme}
                onAddCamera={handleAddCamera}
                onDeleteCamera={() => handleDeleteCamera(currentCameraId)}
              />

              {cameras.length > 1 && (
                <button 
                  onClick={handleNextCamera}
                  className="absolute right-4 z-40 p-3 rounded-xl bg-[var(--p-header-bg)] border border-theme-divider text-theme-main hover:border-[var(--p-subtext)] transition-all active:scale-95 backdrop-blur-md shadow-2xl"
                  title="Próxima Câmera"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* MOSAICO DE CÂMERAS SECUNDÁRIAS */}
            <CameraMosaicGrid 
              cameras={cameras} 
              currentIndex={currentIndex} 
              onSelectCamera={handleSelectCamera} 
            />

          </div>

          {/* LADO DIREITO: PAINEL DE MODELOS ML & ALERTAS (3 COLUNAS) */}
          <div className="lg:col-span-3 flex flex-col gap-5 w-full p-5 rounded-2xl bg-theme-section border border-theme-divider shadow-md transition-colors duration-300 h-[calc(100vh-100px)] min-h-[640px] overflow-y-auto">
            <div className="flex flex-col gap-1">
              <h2 
                className="text-xl font-bold tracking-wider font-mono uppercase text-neutral-400 light:text-neutral-500 panel-text-sub"
                style={{ fontFamily: "'Barlow Condensed', 'Barlow', sans-serif" }}
              >
                DETECÇÃO DE EPIS
              </h2>
              <p className="text-xs font-mono tracking-wide text-neutral-400 light:text-neutral-500 panel-text-sub">
                Selecione os equipamentos a monitorar em tempo real.
              </p>
            </div>

            <div className="w-full">
              <DetectionPanel options={DETECTION_CONFIG} theme={currentTheme} />
            </div>
            
            <div className="h-px w-full border-b border-theme-divider" />
            
            <div className="w-full mt-auto">
              <AlertPanel message={buildMessage()} status={panelStatus} theme={currentTheme} />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default CameraPage;