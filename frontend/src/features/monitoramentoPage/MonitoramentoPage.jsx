import React, { useState, useEffect } from 'react';
import { CameraCarousel } from './components/CameraCarousel';
import { EpiSelectorPanel } from './components/EpiSelectorPanel';

// 🚀 CORREÇÃO: Nova forma correta de importar o shallow para evitar o erro "getSnapshot"
import { useShallow } from 'zustand/react/shallow'; 

import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';

const INITIAL_CAMERAS = [
  { id: 1, nome: "Câmera Triagem A", setor: "Industrial", ip: "192.168.1.50", epis: [{ id: "1", nome: "capacete" }, { id: "2", nome: "oculos" }, { id: "3", nome: "colete" }, { id: "4", nome: "mascara" }, { id: "5", nome: "luvas" }] },
  { id: 2, nome: "Câmera Almoxarifado", setor: "Logística", ip: "192.168.1.51", epis: [{ id: "4", nome: "mascara" }, { id: "5", nome: "luvas" }] },
  { id: 3, nome: "Câmera Linha de Montagem 04", setor: "Produção", ip: "192.168.1.52", epis: [{ id: "1", nome: "capacete" }, { id: "2", nome: "oculos" }, { id: "5", nome: "luvas" }, { id: "4", nome: "mascara" }, { id: "3", nome: "colete" }] },
  { id: 4, nome: "Câmera Entrada Principal", setor: "Portaria", ip: "192.168.1.53", epis: [{ id: "3", nome: "colete" }] },
];

const EMPTY_ARRAY = [];

export function MonitoramentoPage() {
  const [cameras] = useState(INITIAL_CAMERAS);
  const [currentIndex, setCurrentIndex] = useState(1);

  const currentCamera = cameras[currentIndex];
  const currentCameraId = currentCamera?.id;
  
  // 🚀 CORREÇÃO: Pegamos os objetos completos de EPIs para tratar lá dentro do painel
  const currentCameraEpis = currentCamera?.epis || [];

  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);

  // 🚀 CORREÇÃO: Utilizando useShallow de forma nativa e segura
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

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto max-w-[auto] mx-auto w-full justify-between">
      <CameraCarousel 
        cameras={cameras}
        currentIndex={currentIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectCamera={handleSelectCamera}
        // 🚀 CORREÇÃO: Alinhando o nome da prop com o que o Carousel espera internamente
        activeEpi={activeEpisForVisuals.join(', ')} 
      />

      <EpiSelectorPanel 
        epis={currentCameraEpis} 
        activeEpis={activeEpisForVisuals} 
        onToggleEpi={handleToggleEpi}
      />
    </div>
  );
}

export default MonitoramentoPage;