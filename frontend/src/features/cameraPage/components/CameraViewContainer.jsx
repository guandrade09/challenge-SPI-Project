import React, { useState, useEffect } from 'react';
import { CameraView } from './CameraView';

export function CameraViewContainer({
  layoutMode,
  setLayoutMode,
  cameras = [],
  currentCamera,
  activeEpiName,
  isEditingRiskArea,
  onSelectCamera,
  onNextCamera,
  onPrevCamera,
}) {
  const currentCameraId = currentCamera?.id;

  // Guarda os índices das câmeras atribuídas a cada um dos 4 slots
  const [gridIndices, setGridIndices] = useState([0, 1, 2, 3]);

  // Sincroniza os slots garantindo que NUNCA haja câmeras duplicadas na grade
  useEffect(() => {
    const totalCams = cameras.length;
    setGridIndices((prev) => {
      const used = new Set();
      return prev.map((val, idx) => {
        if (idx >= totalCams) {
          return null;
        }

        let chosen = val !== null && val < totalCams ? val : idx;
        
        while (used.has(chosen) && used.size < totalCams) {
          chosen = (chosen + 1) % totalCams;
        }

        if (chosen < totalCams && !used.has(chosen)) {
          used.add(chosen);
          return chosen;
        }

        return null;
      });
    });
  }, [cameras.length]);

  // Lógica para trocar a câmera de um slot
  const handleSlotNavigate = (slotIndex, direction) => {
    const totalAvailable = cameras.length;

    // Se temos 4 ou menos câmeras no total, todas já estão alocadas na grade (ou em slots disponíveis),
    // portanto a troca manual por seta deve ser bloqueada.
    if (totalAvailable <= 4) return;

    setGridIndices((prev) => {
      const updated = [...prev];
      const currentIdx = updated[slotIndex] ?? 0;

      // Coleta todas as câmeras já alocadas nos OUTROS slots para não repetir
      const usedIndices = new Set(
        updated.filter((val, idx) => idx !== slotIndex && val !== null)
      );

      // Se todas as câmeras existentes já estão sendo exibidas nos outros slots
      if (usedIndices.size >= totalAvailable) {
        return prev;
      }

      const step = direction === 'next' ? 1 : -1;
      let candidate = (currentIdx + step + totalAvailable) % totalAvailable;

      // Procura o próximo índice livre
      while (usedIndices.has(candidate)) {
        candidate = (candidate + step + totalAvailable) % totalAvailable;
      }

      updated[slotIndex] = candidate;
      return updated;
    });
  };

  const handleExpandCamera = (camId) => {
    onSelectCamera(camId);
    if (setLayoutMode) setLayoutMode('single');
  };

  // MODO: VISUALIZAÇÃO ÚNICA
  if (layoutMode === 'single') {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl bg-neutral-950 border border-theme-divider shadow-2xl p-1">
        {currentCamera ? (
          <CameraView
            camera={currentCamera}
            activeEpi={activeEpiName}
            isEditingRiskArea={isEditingRiskArea}
            totalCameras={cameras.length}
            onNextCamera={onNextCamera}
            onPrevCamera={onPrevCamera}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/60 border border-dashed border-neutral-800 rounded-xl text-neutral-500 font-mono text-xs">
            <span>NENHUMA CÂMERA SELECIONADA</span>
          </div>
        )}
      </div>
    );
  }

  // MODO: GRADE 2X2
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-2 rounded-2xl bg-neutral-950 border border-theme-divider shadow-2xl overflow-hidden">
      {gridIndices.map((camIdx, slotIndex) => {
        const cam = camIdx !== null && cameras[camIdx] ? cameras[camIdx] : null;

        return (
          <div key={`slot-${slotIndex}`} className="w-full h-full relative overflow-hidden rounded-none">
            {cam ? (
              <CameraView
                camera={cam}
                activeEpi={cam.id === currentCameraId ? activeEpiName : null}
                isEditingRiskArea={cam.id === currentCameraId && isEditingRiskArea}
                totalCameras={cameras.length}
                onExpand={() => handleExpandCamera(cam.id)}
                onNextSlotCamera={() => handleSlotNavigate(slotIndex, 'next')}
                onPrevSlotCamera={() => handleSlotNavigate(slotIndex, 'prev')}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/60 border border-dashed border-neutral-800 rounded-none text-neutral-500 font-mono text-xs">
                <span>SLOT {slotIndex + 1} - VAZIO</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CameraViewContainer;