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
  detectionsVisibility = {},
  onToggleDetections,
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

    if (totalAvailable <= 4) return;

    setGridIndices((prev) => {
      const updated = [...prev];
      const currentIdx = updated[slotIndex] ?? 0;

      const usedIndices = new Set(
        updated.filter((val, idx) => idx !== slotIndex && val !== null)
      );

      if (usedIndices.size >= totalAvailable) {
        return prev;
      }

      const step = direction === 'next' ? 1 : -1;
      let candidate = (currentIdx + step + totalAvailable) % totalAvailable;

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

  // MODO: VISUALIZAÇÃO ÚNICA (Sem padding interno)
  if (layoutMode === 'single') {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl bg-neutral-950 border border-theme-divider shadow-2xl">
        {currentCamera ? (
          <CameraView
            key={currentCamera.id}
            camera={currentCamera}
            activeEpi={activeEpiName}
            isEditingRiskArea={isEditingRiskArea}
            totalCameras={cameras.length}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            onNextCamera={onNextCamera}
            onPrevCamera={onPrevCamera}
            showDetections={detectionsVisibility[currentCamera.id] !== false}
            onToggleDetections={onToggleDetections}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/60 border border-dashed border-neutral-800 rounded-2xl text-neutral-500 font-mono text-xs">
            <span>NENHUMA CÂMERA SELECIONADA</span>
          </div>
        )}
      </div>
    );
  }

  // MODO: GRADE 2X2 (Sem padding interno)
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 rounded-2xl bg-neutral-950 border border-theme-divider shadow-2xl overflow-hidden">
      {gridIndices.map((camIdx, slotIndex) => {
        const cam = camIdx !== null && cameras[camIdx] ? cameras[camIdx] : null;

        return (
          <div key={`slot-${slotIndex}`} className="w-full h-full relative overflow-hidden">
            {cam ? (
              <CameraView
                key={cam.id}
                camera={cam}
                activeEpi={cam.id === currentCameraId ? activeEpiName : null}
                isEditingRiskArea={cam.id === currentCameraId && isEditingRiskArea}
                totalCameras={cameras.length}
                layoutMode={layoutMode}
                setLayoutMode={setLayoutMode}
                onExpand={() => handleExpandCamera(cam.id)}
                onNextSlotCamera={() => handleSlotNavigate(slotIndex, 'next')}
                onPrevSlotCamera={() => handleSlotNavigate(slotIndex, 'prev')}
                showDetections={detectionsVisibility[cam.id] !== false}
                onToggleDetections={onToggleDetections}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/60 border border-dashed border-neutral-800 text-neutral-500 font-mono text-xs">
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
