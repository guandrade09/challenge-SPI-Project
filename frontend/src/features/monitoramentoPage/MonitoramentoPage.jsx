// src/features/monitoramentoPage/MonitoramentoPage.jsx
import React, { useState, useEffect } from 'react';
import { CameraCarousel } from './components/CameraCarousel';
import { EpiSelectorPanel } from './components/EpiSelectorPanel';

import { useShallow } from 'zustand/react/shallow'; 

import { useCameraStore } from '../../store/useCameraStore'; // 🚀 Nova Store de Câmeras
import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';
import { useUiStore } from '../../store/useUiStore';

const EMPTY_ARRAY = [];

export function MonitoramentoPage() {
  const currentTheme = useUiStore((s) => s.theme);
  
  // 🚀 Câmeras vindas da Store Global do Zustand
  const cameras = useCameraStore((state) => state.cameras);
  const addCamera = useCameraStore((state) => state.addCamera);

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentCamera = cameras[currentIndex] || cameras[0];
  const currentCameraId = currentCamera?.id;
  
  const currentCameraEpis = currentCamera?.epis || [];

  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);

  const activeEpisForVisuals = useCameraPresetsStore(
    useShallow((state) => {
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

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % cameras.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + cameras.length) % cameras.length);
  const handleSelectCamera = (index) => setCurrentIndex(index);

  const handleToggleEpi = (epiName) => {
    toggleEpiForCamera(currentCameraId, epiName);
  };

  // 🚀 Handler unificado que cadastra via store e já foca na nova câmera
  const handleAddCamera = async (newCamData) => {
    const createdCam = await addCamera(newCamData);
    // Move o carrossel para a recém criada
    const newIndex = cameras.length; // Como o estado atualiza, ela será o último item
    setCurrentIndex(newIndex);
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto max-w-[auto] mx-auto w-full justify-between">
      <CameraCarousel 
        cameras={cameras}
        currentIndex={currentIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectCamera={handleSelectCamera}
        activeEpi={activeEpisForVisuals.join(', ')} 
        theme={currentTheme}
        onAddCamera={handleAddCamera}
      />

      <EpiSelectorPanel 
        epis={currentCameraEpis} 
        activeEpis={activeEpisForVisuals} 
        onToggleEpi={handleToggleEpi}
        theme={currentTheme}
      />
    </div>
  );
}

export default MonitoramentoPage;