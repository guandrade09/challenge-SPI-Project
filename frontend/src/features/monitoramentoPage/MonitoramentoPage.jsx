// src/features/monitoramentoPage/MonitoramentoPage.jsx
import React, { useState, useEffect } from 'react';
import { CameraCarousel } from './components/CameraCarousel';
import { EpiSelectorPanel } from './components/EpiSelectorPanel';
import { MonitoramentoSkeleton } from './components/MonitoramentoSkeleton';

import { useShallow } from 'zustand/react/shallow'; 

import { useCameraStore } from '../../store/useCameraStore';
import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';
import { useUiStore } from '../../store/useUiStore';
import ButtonAddCam from './components/ButtonAddCam';

const EMPTY_ARRAY = [];

export function MonitoramentoPage() {
  const currentTheme = useUiStore((s) => s.theme);
  
  // 🚀 Câmeras e Status do Zustand
  const cameras = useCameraStore((state) => state.cameras);
  const isLoading = useCameraStore((state) => state.isLoading);
  const fetchCameras = useCameraStore((state) => state.fetchCameras);
  const addCamera = useCameraStore((state) => state.addCamera);

  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Busca as câmeras no banco ao carregar a página
  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const currentCamera = cameras[currentIndex] || cameras[0];
  const currentCameraId = currentCamera?.id;
  
  const currentCameraEpis = currentCamera?.epis || [
    { id: "1", nome: "capacete" },
    { id: "2", nome: "oculos" },
    { id: "3", nome: "colete" },
    { id: "4", nome: "mascara" },
    { id: "5", nome: "luvas" }
  ];

  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);

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

  // Navegação Segura
  const handleNext = () => {
    if (cameras.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % cameras.length);
  };

  const handlePrev = () => {
    if (cameras.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + cameras.length) % cameras.length);
  };

  const handleSelectCamera = (index) => setCurrentIndex(index);

  const handleToggleEpi = (epiName) => {
    if (currentCameraId) {
      toggleEpiForCamera(currentCameraId, epiName);
    }
  };

  // Cadastra via store e redireciona o carrossel para a nova câmera
  const handleAddCamera = async (newCamData) => {
    try {
      await addCamera(newCamData);
      const updatedCameras = useCameraStore.getState().cameras;
      setCurrentIndex(Math.max(0, updatedCameras.length - 1));
    } catch (err) {
      console.error("Falha ao salvar câmera:", err);
    }
  };

  // 🚀 Se estiver carregando pela primeira vez, exibe o Skeleton
  if (isLoading && cameras.length === 0) {
    return <MonitoramentoSkeleton theme={currentTheme} />;
  }

  // Se já carregou mas não tem câmeras cadastradas no banco
  if (!isLoading && cameras.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Nenhuma câmera cadastrada</h2>
        <p className="text-slate-400">Cadastre sua primeira câmera para iniciar o monitoramento.</p>
        
        {/* 🚀 Botão com sintaxe auto-fechável corrigida */}
        <div className="pt-2">
          <ButtonAddCam theme={currentTheme} onAddCamera={handleAddCamera} />
        </div>
      </div>
    );
  }

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