import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { DetectionPanel } from './components';
import { CameraViewContainer } from './components/CameraViewContainer';
import { CameraMosaicGrid } from './components/CameraMosaicGrid';
import { MonitoramentoSkeleton } from './components/MonitoramentoSkeleton';

import { useCameraStore } from '../../store/useCameraStore';
import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useUiStore } from '../../store/useUiStore';
import { DETECTION_CONFIG } from '../../enums/enums';

const EMPTY_ARRAY = [];

export const CameraPage = () => {
  const currentTheme = useUiStore((s) => s.theme);
  
  const cameras = useCameraStore((state) => state.cameras);
  const isLoading = useCameraStore((state) => state.isLoading);
  const fetchCameras = useCameraStore((state) => state.fetchCameras);
  const addCamera = useCameraStore((state) => state.addCamera);
  const deleteCamera = useCameraStore((state) => state.deleteCamera);
  const updateCamera = useCameraStore((state) => state.updateCamera);

  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);
  const lastCameraId = useCameraPresetsStore((state) => state.lastCameraId);
  const setLastCameraId = useCameraPresetsStore((state) => state.setLastCameraId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditingRiskArea, setIsEditingRiskArea] = useState(false);
  const [activeTab, setActiveTab] = useState('epis');
  const [layoutMode, setLayoutMode] = useState('single');

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  useEffect(() => {
    if (cameras.length > 0 && lastCameraId) {
      const savedIndex = cameras.findIndex((c) => c.id === lastCameraId);
      if (savedIndex !== -1) setCurrentIndex(savedIndex);
    }
  }, [cameras, lastCameraId]);

  const currentCamera = cameras[currentIndex] || cameras[0];
  const currentCameraId = currentCamera?.id;

  const handleSelectCamera = (target) => {
    setIsEditingRiskArea(false);
    if (target === null || target === undefined) return;
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
    const nextIdx = (currentIndex + 1) % cameras.length;
    handleSelectCamera(nextIdx);
  };

  const handlePrevCamera = () => {
    if (cameras.length === 0) return;
    const prevIdx = (currentIndex - 1 + cameras.length) % cameras.length;
    handleSelectCamera(prevIdx);
  };

  const presetData = useCameraPresetsStore(
    useShallow((state) => (currentCameraId ? state.presets[currentCameraId] : null))
  );

  const activeEpisForVisuals = React.useMemo(() => {
    if (!presetData) return EMPTY_ARRAY;
    let rawList = [];
    if (Array.isArray(presetData)) {
      rawList = presetData;
    } else if (typeof presetData === 'object') {
      rawList = Array.isArray(presetData.selectedEpis) ? presetData.selectedEpis : [];
    }
    return rawList
      .map((item) => (typeof item === 'object' && item !== null ? item.id || item.name : item))
      .filter(Boolean);
  }, [presetData]);

  const activeEpiName = activeEpisForVisuals.length > 0 ? activeEpisForVisuals.join(', ').toUpperCase() : null;
  const isDark = currentTheme === 'dark';

  if (isLoading && cameras.length === 0) return <MonitoramentoSkeleton theme={currentTheme} />;

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300 text-theme-title ${isDark ? 'dark' : 'light'}`}>
      <div className="mx-auto p-2 sm:p-4 md:p-5 max-w-[1800px] w-full">
        <main className="flex flex-col gap-3 sm:gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start">

            {/* CONTAINER PRINCIPAL DA CÂMERA */}
            <div className="lg:col-span-9 flex flex-col gap-2 h-[50vh] min-h-[320px] lg:h-[calc(100vh-200px)] lg:min-h-[520px]">
              
              {/* PAINEL DE CÂMERAS */}
              <div className="flex-1 min-h-0 relative">
                <CameraViewContainer
                  layoutMode={layoutMode}
                  setLayoutMode={setLayoutMode}
                  cameras={cameras}
                  currentCamera={currentCamera}
                  onExpand={() => handleExpandCamera(cam.id)}
                  activeEpiName={activeEpiName}
                  isEditingRiskArea={isEditingRiskArea}
                  onSelectCamera={handleSelectCamera}
                  onNextCamera={handleNextCamera}
                  onPrevCamera={handlePrevCamera}
                />
              </div>
            </div>

            {/* PAINEL LATERAL */}
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
                  onToggleEpi={(arg1, arg2) => {
                    if (arg2 !== undefined) {
                      toggleEpiForCamera(arg1, arg2);
                    } else {
                      toggleEpiForCamera(currentCameraId, arg1);
                    }
                  }}
                  onAddCamera={addCamera}
                  onDeleteCamera={deleteCamera}
                  onEditCamera={updateCamera}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>
            </div>

          </div>

          {/* MOSAICO INFERIOR */}
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