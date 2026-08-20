import React, { useState, useEffect } from 'react';
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
  
  // Stores de Câmeras
  const cameras = useCameraStore((state) => state.cameras);
  const isLoading = useCameraStore((state) => state.isLoading);
  const fetchCameras = useCameraStore((state) => state.fetchCameras);
  const addCamera = useCameraStore((state) => state.addCamera);
  const deleteCamera = useCameraStore((state) => state.deleteCamera);

  // Stores de Presets & Zonas de Risco
  const removePresetForCamera = useCameraPresetsStore((state) => state.removePresetForCamera);
  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);

  const { alertaAtivo, limparAlertaAtivo, liveDetections } = useMonitoramentoStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditingRiskArea, setIsEditingRiskArea] = useState(false);

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

  // VERIFICA SE A CÂMERA ATUAL TEM ÁREA DE RISCO SALVA
  const currentRiskArea = useCameraPresetsStore(
    useShallow((s) => {
      if (!currentCameraId) return null;
      return s.getRiskAreaForCamera(currentCameraId) || currentCamera?.riskArea || null;
    })
  );

  const activeEpisForVisuals = useCameraPresetsStore(
    useShallow((state) => {
      if (!currentCameraId) return EMPTY_ARRAY;
      const data = state.presets[currentCameraId];
      if (Array.isArray(data)) return data;
      return data?.selectedEpis || EMPTY_ARRAY;
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

  const handleToggleEpi = (epiId) => {
    if (!currentCameraId) return;
    toggleEpiForCamera(currentCameraId, epiId);
    const toggleDetection = useMonitoramentoStore.getState().toggleDetection;
    toggleDetection(epiId);
  };

  const handleSelectCamera = (target) => {
    setIsEditingRiskArea(false);

    if (!target) return;

    const targetId = typeof target === 'object' ? target.id : target;
    const foundIndex = cameras.findIndex((cam) => cam.id === targetId);

    if (foundIndex !== -1) {
      setCurrentIndex(foundIndex);
    } else if (typeof target === 'number' && target >= 0 && target < cameras.length) {
      setCurrentIndex(target);
    }
  };

  const handleNextCamera = () => {
    if (cameras.length === 0) return;
    setIsEditingRiskArea(false);
    setCurrentIndex((prev) => (prev + 1) % cameras.length);
  };

  const handlePrevCamera = () => {
    if (cameras.length === 0) return;
    setIsEditingRiskArea(false);
    setCurrentIndex((prev) => (prev - 1 + cameras.length) % cameras.length);
  };

  const handleAddCamera = async (newCamData) => {
    try {
      await addCamera(newCamData);
      const updatedCameras = useCameraStore.getState().cameras;
      setCurrentIndex(Math.max(0, updatedCameras.length - 1));
    } catch (err) {
      console.error("Falha ao salvar câmera:", err);
      throw err;
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
      throw err;
    }
  };

  // LIMPEZA DE ÁREA DE RISCO
  const handleClearRiskArea = () => {
    window.dispatchEvent(new CustomEvent('clear_risk_area'));
    setIsEditingRiskArea(false);
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
      <div className={`panel-theme-${currentTheme} min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 bg-[var(--p-bg)] ${isDark ? 'dark' : 'light'}`}>
        <h2 className="text-lg sm:text-xl text-theme-title tracking-wider font-theme-title">Nenhuma câmera cadastrada</h2>
        <p className="text-xs sm:text-sm text-theme-main tracking-wider font-theme-body">Cadastre sua primeira câmera para iniciar o monitoramento.</p>
        
        <div className="pt-4">
          <ButtonAddCam 
            titlePopup="Adicionar Câmera"
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
      <div className="mx-auto p-2 sm:p-4 md:p-5 max-w-[1800px] w-full">
        
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start">
          
          {/* LADO ESQUERDO: CÂMERA PRINCIPAL & MOSAICO */}
          <div className="lg:col-span-9 flex flex-col w-full gap-3 sm:gap-4">
            
            {/* CONTAINER PRINCIPAL DO PLAYER */}
            <div className="relative w-full h-[50vh] min-h-[320px] lg:h-[calc(100vh-210px)] lg:min-h-[520px] flex items-center justify-center overflow-hidden rounded-2xl bg-neutral-950 border border-theme-divider shadow-2xl">
              <CameraView 
                camera={currentCamera}
                activeEpi={activeEpiName}
                isEditingRiskArea={isEditingRiskArea}
                onNextCamera={handleNextCamera}
                onPrevCamera={handlePrevCamera}
                totalCameras={cameras.length}
              />
            </div>

            {/* MOSAICO DE CÂMERAS SECUNDÁRIAS */}
            <CameraMosaicGrid 
              cameras={cameras} 
              currentIndex={currentIndex} 
              currentCamera={currentCamera}
              onSelectCamera={handleSelectCamera} 
            />

          </div>

          {/* LADO DIREITO: PAINEL LATERAL DUAL (EPIs E GESTÃO) & ALERTAS */}
          <div className="lg:col-span-3 flex flex-col gap-3 sm:gap-4 w-full p-3.5 sm:p-5 rounded-2xl bg-[var(--p-header-bg)] border border-theme-divider shadow-xl transition-colors duration-300 h-auto lg:h-[calc(100vh-140px)] lg:min-h-[580px]">
            
            <div className="flex-1 min-h-0 flex flex-col">
              <DetectionPanel 
                options={DETECTION_CONFIG} 
                theme={currentTheme}
                cameras={cameras}
                currentCamera={currentCamera}
                currentIndex={currentIndex}
                onSelectCamera={handleSelectCamera}
                isEditingRiskArea={isEditingRiskArea}
                setIsEditingRiskArea={setIsEditingRiskArea}
                hasRiskArea={!!currentRiskArea}
                onToggleEpi={handleToggleEpi}
                onAddCamera={handleAddCamera}
                onDeleteCamera={handleDeleteCamera}
                onClearRiskArea={handleClearRiskArea}
              />
            </div>
            
            <div className="h-px w-full border-b border-theme-divider opacity-50 shrink-0 my-1 lg:my-0" />
            
            <div className="w-full shrink-0">
              <AlertPanel message={buildMessage()} status={panelStatus} theme={currentTheme} />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default CameraPage;