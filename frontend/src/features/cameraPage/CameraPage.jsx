import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { formatLabel } from '../../utils/formatLabel';

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
  'CAPACETE - AUSENTE': 'Sem Capacete',
  'CAPACETE - ERRADO':  'Capacete Errado',
  'CAPACETE - CERTO':   'Capacete OK',
  'COLETE - AUSENTE':   'Sem Colete',
  'COLETE - CERTO':     'Colete OK',
  'MASCARA - AUSENTE':  'Sem Máscara',
  'MASCARA - ERRADO':   'Máscara Errada',
  'MASCARA - CERTO':    'Máscara OK',
  'OCULOS - AUSENTE':   'Sem Óculos',
  'OCULOS - ERRADO':    'Óculos Errado',
  'OCULOS - CERTO':     'Óculos OK',
  'AURICULAR - AUSENTE':'Sem Auricular',
  'AURICULAR - ERRADO': 'Auricular Errado',
  'AURICULAR - CERTO':  'Auricular OK',
  'BOTAS - AUSENTE':    'Sem Botas',
  'BOTAS - CERTO':      'Botas OK',
  'PESSOA':             'Pessoa',
};

const RISK_LABELS = new Set([
  'CAPACETE - AUSENTE', 'CAPACETE - ERRADO',
  'COLETE - AUSENTE',
  'MASCARA - AUSENTE', 'MASCARA - ERRADO',
  'OCULOS - AUSENTE', 'OCULOS - ERRADO',
  'AURICULAR - AUSENTE', 'AURICULAR - ERRADO',
  'BOTAS - AUSENTE',
]);

const LABEL_TO_TOGGLE = {
  'CAPACETE - AUSENTE': 'capacete', 'CAPACETE - ERRADO': 'capacete', 'CAPACETE - CERTO': 'capacete',
  'COLETE - AUSENTE':   'colete',   'COLETE - CERTO':    'colete',
  'MASCARA - AUSENTE':  'mascara',  'MASCARA - ERRADO':  'mascara',  'MASCARA - CERTO': 'mascara',
  'OCULOS - AUSENTE':   'oculos',   'OCULOS - ERRADO':   'oculos',   'OCULOS - CERTO':  'oculos',
  'AURICULAR - AUSENTE':'auricular','AURICULAR - ERRADO': 'auricular','AURICULAR - CERTO':'auricular',
  'BOTAS - AUSENTE':    'botas',    'BOTAS - CERTO':      'botas',
};

const formatDetection = (d) => {
  const icon = RISK_LABELS.has(d.label) ? '⚠' : '✓';
  return `${icon} ${formatLabel(d.label)} — ${(d.confidence * 100).toFixed(0)}%`;
};

export const CameraPage = () => {
  const currentTheme = useUiStore((s) => s.theme);
  
  // Stores de Câmeras
  const cameras = useCameraStore((state) => state.cameras);
  const isLoading = useCameraStore((state) => state.isLoading);
  const fetchCameras = useCameraStore((state) => state.fetchCameras);
  const addCamera = useCameraStore((state) => state.addCamera);
  const deleteCamera = useCameraStore((state) => state.deleteCamera);
  const updateCamera = useCameraStore((state) => state.updateCamera);

  // Stores de Presets & Zonas de Risco
  const removePresetForCamera = useCameraPresetsStore((state) => state.removePresetForCamera);
  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);
  const lastCameraId = useCameraPresetsStore((state) => state.lastCameraId);
  const setLastCameraId = useCameraPresetsStore((state) => state.setLastCameraId);

  const { alertaAtivo, limparAlertaAtivo, liveDetections, livePose, verdict } = useMonitoramentoStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditingRiskArea, setIsEditingRiskArea] = useState(false);
  const [activeTab, setActiveTab] = useState('epis');

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // Restaura a posição da última câmera assim que a lista de câmeras carregar
  useEffect(() => {
    if (cameras.length > 0 && lastCameraId) {
      const savedIndex = cameras.findIndex((c) => c.id === lastCameraId);
      if (savedIndex !== -1) {
        setCurrentIndex(savedIndex);
      }
    }
  }, [cameras, lastCameraId]);

  useEffect(() => {
    if (!alertaAtivo) return;
    const timer = setTimeout(limparAlertaAtivo, 10000);
    return () => clearTimeout(timer);
  }, [alertaAtivo, limparAlertaAtivo]);

  const currentCamera = cameras[currentIndex] || cameras[0];
  const currentCameraId = currentCamera?.id;

  // Limpa detecções ao trocar de câmera para não mostrar dados stale
  useEffect(() => {
    useMonitoramentoStore.setState({ liveDetections: [], livePose: [], verdict: null, alertaAtivo: null });
  }, [currentCameraId]);

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

    const setor = currentCamera?.setor ?? '';
    const presetsState = useCameraPresetsStore.getState();
    const sectorEpisUnion = new Set(activeEpisForVisuals);
    cameras
      .filter((c) => c.setor === setor && c.id !== currentCameraId)
      .forEach((cam) => presetsState.getEpiForCamera(cam.id).forEach((e) => sectorEpisUnion.add(e)));

    const sectorDetections = {
      colete: false, oculos: false, capacete: false, mascara: false,
      luvas: false, auricular: false, botas: false, ergonomia: true,
    };
    sectorEpisUnion.forEach((epi) => { if (epi in sectorDetections) sectorDetections[epi] = true; });

    useMonitoramentoStore.getState().syncToOrquestrador(setor, sectorDetections);
  }, [currentCameraId, activeEpisForVisuals]);

  const handleToggleEpi = (epiId) => {
    if (!currentCameraId) return;
    toggleEpiForCamera(currentCameraId, epiId);
    const toggleDetection = useMonitoramentoStore.getState().toggleDetection;
    toggleDetection(epiId, currentCamera?.setor ?? '');
  };

  const handleSelectCamera = (target) => {
    setIsEditingRiskArea(false);

    if (!target) return;

    const targetId = typeof target === 'object' ? target.id : target;
    const foundIndex = cameras.findIndex((cam) => cam.id === targetId);

    if (foundIndex !== -1) {
      setCurrentIndex(foundIndex);
      setLastCameraId(cameras[foundIndex].id);
    } else if (typeof target === 'number' && target >= 0 && target < cameras.length) {
      setCurrentIndex(target);
      setLastCameraId(cameras[target].id);
    }
  };

  const handleNextCamera = () => {
    if (cameras.length === 0) return;
    setIsEditingRiskArea(false);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setCurrentIndex(nextIndex);
    setLastCameraId(cameras[nextIndex].id);
  };

  const handlePrevCamera = () => {
    if (cameras.length === 0) return;
    setIsEditingRiskArea(false);
    const prevIndex = (currentIndex - 1 + cameras.length) % cameras.length;
    setCurrentIndex(prevIndex);
    setLastCameraId(cameras[prevIndex].id);
  };

  const handleAddCamera = async (newCamData) => {
    try {
      await addCamera(newCamData);
      const updatedCameras = useCameraStore.getState().cameras;
      const newIndex = Math.max(0, updatedCameras.length - 1);
      setCurrentIndex(newIndex);
      if (updatedCameras[newIndex]) {
        setLastCameraId(updatedCameras[newIndex].id);
      }
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

      let nextIndex = 0;
      if (remainingCount === 0) {
        nextIndex = 0;
        setLastCameraId(null);
      } else if (deletedIndex >= remainingCount) {
        nextIndex = remainingCount - 1;
        setLastCameraId(updatedCameras[nextIndex].id);
      } else {
        nextIndex = deletedIndex;
        setLastCameraId(updatedCameras[nextIndex].id);
      }
      setCurrentIndex(nextIndex);
    } catch (err) {
      console.error("Falha ao deletar câmera:", err);
      throw err;
    }
  };

  const handleEditCamera = async (idToEdit, updatedFields) => {
    try {
      await updateCamera(idToEdit, updatedFields);
    } catch (err) {
      console.error("Falha ao editar câmera:", err);
      throw err;
    }
  };

  const handleClearRiskArea = () => {
    window.dispatchEvent(new CustomEvent('clear_risk_area'));
    setIsEditingRiskArea(false);
  };

  const relevantDetections = liveDetections.filter((d) => {
    const toggleKey = LABEL_TO_TOGGLE[d.label];
    return !toggleKey || activeEpisForVisuals.includes(toggleKey);
  });

  const buildMessage = () => {
    const linhas = [];

    if (alertaAtivo) {
      linhas.push(`⚠ ${formatLabel(alertaAtivo.label)} — confiança: ${(alertaAtivo.confidence * 100).toFixed(0)}%`);
    }

    const epiLinhas = relevantDetections
      .filter((d) => LABEL_PT[d.label])
      .map(formatDetection);
    linhas.push(...epiLinhas);

    if (livePose && livePose.length > 0) {
      livePose.forEach((p, i) => {
        if (p.reba_score != null) {
          const nivel = p.reba_level ?? '—';
          const nivelPt = { ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo', MUITO_ALTO: 'Muito Alto' }[nivel] ?? nivel;
          const icon = nivel === 'ALTO' || nivel === 'MUITO_ALTO' ? '⚠' : nivel === 'MEDIO' ? '⚡' : '✓';
          linhas.push(`${icon} Risco Ergonômico ${nivelPt} — Pessoa ${i + 1} (REBA ${p.reba_score})`);
        }
        if (p.queda) {
          linhas.push(`⚠ Queda detectada — Pessoa ${i + 1}`);
        }
      });
    }

    if (verdict?.reasons && verdict.reasons.length > 0) {
      verdict.reasons.forEach((r) => {
        if (typeof r === 'string') linhas.push(`⚠ ${r}`);
      });
    }

    if (linhas.length === 0) return 'Aguardando detecções...';
    return linhas.join('\n');
  };

  const activeEpiName = activeEpisForVisuals.length > 0
    ? activeEpisForVisuals.join(', ').toUpperCase()
    : null;

  const hasRebaRisk = livePose?.some((p) => p.reba_level === 'ALTO' || p.queda);
  const hasZonaRisk = verdict?.reasons?.some((r) =>
    typeof r === 'string' && (r.includes('zona') || r.includes('perigo') || r.includes('risco'))
  );
  const hasEpiAtencao = relevantDetections.length > 0 || (livePose?.length > 0 && !hasRebaRisk);

  const panelStatuses = (() => {
    const s = [];
    if (alertaAtivo || hasRebaRisk || hasZonaRisk) s.push(PANEL_STATUS.ALERTA);
    if (hasEpiAtencao) s.push(PANEL_STATUS.ATENCAO);
    return s.length > 0 ? s : [PANEL_STATUS.PRONTO];
  })();

  const isDark = currentTheme === 'dark';

  if (isLoading && cameras.length === 0) {
    return <MonitoramentoSkeleton theme={currentTheme} />;
  }

  if (!isLoading && cameras.length === 0) {
    return (
      <div className={`panel-theme-${currentTheme} min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 ${isDark ? 'dark' : 'light'}`}>
        <h2 className="text-lg sm:text-xl text-[var(--p-text-title)] tracking-wider font-theme-title">Nenhuma câmera cadastrada</h2>
        <p className="text-xs sm:text-sm text-[var(--p-text-main)] tracking-wider font-theme-body">Cadastre sua primeira câmera para iniciar o monitoramento.</p>
        
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
        
        <main className="flex flex-col gap-3 sm:gap-5">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start">

            <div className="lg:col-span-9 h-[50vh] min-h-[320px] lg:h-[calc(100vh-200px)] lg:min-h-[520px] flex items-center justify-center overflow-hidden rounded-2xl bg-neutral-950 border border-theme-divider shadow-2xl">
              <CameraView
                camera={currentCamera}
                activeEpi={activeEpiName}
                isEditingRiskArea={isEditingRiskArea}
                onNextCamera={handleNextCamera}
                onPrevCamera={handlePrevCamera}
                totalCameras={cameras.length}
              />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-3 sm:gap-4 w-full p-3.5 sm:p-5 rounded-2xl bg-[var(--p-header-bg)] border border-theme-divider shadow-xl transition-colors duration-300 h-[50vh] min-h-[320px] lg:h-[calc(100vh-200px)] lg:min-h-[520px] overflow-hidden">

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
                  onEditCamera={handleEditCamera}
                  onClearRiskArea={handleClearRiskArea}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>

              <div className="h-px w-full border-b border-theme-divider opacity-50 shrink-0 my-1 lg:my-0" />

              {activeTab === 'epis' && (
                <div className="w-full shrink-0">
                  <AlertPanel message={buildMessage()} statuses={panelStatuses} theme={currentTheme} />
                </div>
              )}
            </div>

          </div>

          <CameraMosaicGrid
            cameras={cameras}
            currentIndex={currentIndex}
            currentCamera={currentCamera}
            onSelectCamera={handleSelectCamera}
          />

        </main>
      </div>
    </div>
  );
};

export default CameraPage;