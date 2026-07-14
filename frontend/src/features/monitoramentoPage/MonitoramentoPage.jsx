import React, { useState, useEffect } from 'react';
import { CameraCarousel } from './components/CameraCarousel';
import { EpiSelectorPanel } from './components/EpiSelectorPanel';

// 1. Adicione a importação do shallow aqui em cima:
import { shallow } from 'zustand/shallow'; 

// Importando ambas as stores
import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useMonitoramentoStore } from '../../store/useMonitoramentoStore';

const INITIAL_CAMERAS = [
  { id: 1, nome: "Câmera Triagem A", setor: "Industrial", ip: "192.168.1.50", epis: ["capacete", "oculos", "colete"] },
  { id: 2, nome: "Câmera Almoxarifado", setor: "Logística", ip: "192.168.1.51", epis: ["mascara", "luvas"] },
  { id: 3, nome: "Câmera Linha de Montagem 04", setor: "Produção", ip: "192.168.1.52", epis: ["capacete", "oculos", "luvas"] },
  { id: 4, nome: "Câmera Entrada Principal", setor: "Portaria", ip: "192.168.1.53", epis: ["colete"] },
];

// Criamos uma referência estável para o array vazio fora do componente
// Isso impede o erro "The result of getSnapshot should be cached"
const EMPTY_ARRAY = [];

export function MonitoramentoPage() {
  const [cameras] = useState(INITIAL_CAMERAS);
  const [currentIndex, setCurrentIndex] = useState(1);

  const currentCamera = cameras[currentIndex];
  const currentCameraId = currentCamera?.id;
  const currentCameraEpis = currentCamera?.epis || [];

  const toggleEpiForCamera = useCameraPresetsStore((state) => state.toggleEpiForCamera);

  // 2. 🔥 ALTERAÇÃO AQUI: Adicionamos o 'shallow' no final do seletor.
  // Isso avisa o Zustand: "Só force o re-render se os elementos de dentro do array mudarem!"
  const activeEpisForVisuals = useCameraPresetsStore((state) => {
    const data = state.presets[currentCameraId];
    return Array.isArray(data) ? data : EMPTY_ARRAY;
  }, shallow); // ← O segredo está aqui 🚀

  // === Mantenha o resto do seu useEffect e funções exatamente iguais ===
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
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full justify-between">
      <CameraCarousel 
        cameras={cameras}
        currentIndex={currentIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectCamera={handleSelectCamera}
        activeEpis={activeEpisForVisuals}
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