// src/features/monitoramentoPage/components/CameraMosaicGrid.jsx
import React, { useRef, useState } from 'react';
import { Video, CheckCircle2 } from 'lucide-react';

export function CameraMosaicGrid({ cameras, currentIndex, onSelectCamera }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);

  if (!cameras || cameras.length <= 1) return null;

  // Lógica de Arrasta e Solta (Drag to Scroll)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setDraggedDistance(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Velocidade de rolagem
    scrollRef.current.scrollLeft = scrollLeft - walk;
    setDraggedDistance(Math.abs(x - startX));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Garante seleção de câmera somente se não houver arraste expressivo
  const handleCameraClick = (idx) => {
    if (draggedDistance < 5) {
      onSelectCamera(idx);
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-theme-head">
          MOSAICO DE CÂMERAS ({cameras.length})
        </span>
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest hidden sm:inline">
          ← Arrasta para navegar →
        </span>
      </div>

      {/* Container "Segura e Arrasta" com Scrollbar Oculta */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 w-full overflow-x-auto sm:overflow-x-visible select-none py-1 scrollbar-none transition-cursor ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none',  /* IE/Edge */
        }}
      >
        {cameras.map((cam, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={cam.id || idx}
              onClick={() => handleCameraClick(idx)}
              className={`group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-xl border transition-all duration-200 text-left overflow-hidden shrink-0 w-[140px] sm:w-auto ${
                isActive
                  ? 'bg-[var(--p-header-bg)] border-[var(--p-subtext)] shadow-lg ring-1 ring-[var(--p-subtext)] scale-[1.01]'
                  : 'bg-theme-section border-theme-divider hover:border-neutral-500 hover:bg-[var(--p-header-bg)] opacity-70 hover:opacity-100'
              }`}
            >
              {/* Header do Card Miniatura */}
              <div className="flex items-center justify-between w-full mb-1.5 sm:mb-2 pointer-events-none">
                <span className="text-[11px] sm:text-xs font-bold font-mono text-theme-title truncate max-w-[75%]">
                  {cam.nome || `CAM-${idx + 1}`}
                </span>
                {isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--p-subtext)] shrink-0" />
                ) : (
                  <Video className="w-3.5 h-3.5 text-neutral-500 group-hover:text-theme-title shrink-0 transition-colors" />
                )}
              </div>

              {/* Visor de Preview do Mosaico */}
              <div className="w-full h-12 sm:h-16 rounded-lg bg-[var(--p-graf-bg)] border border-theme-divider flex items-center justify-center relative overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                
                {/* Indicador Óptico */}
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full absolute top-1.5 right-1.5 z-20 ${isActive ? 'bg-[var(--p-subtext)] animate-pulse' : 'bg-neutral-600'}`} />

                <span className="text-[9px] sm:text-[10px] font-mono text-neutral-400 z-20 font-bold uppercase tracking-wider truncate px-1">
                  {cam.setor || 'CCTV'}
                </span>
              </div>

              {/* IP / Identificador no Footer */}
              <span className="text-[8px] sm:text-[9px] font-mono text-neutral-500 mt-1 sm:mt-1.5 truncate w-full pointer-events-none">
                {cam.ip || `ID: ${cam.id}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Regra CSS para ocultar Scrollbars no Webkit (Chrome/Safari) */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default CameraMosaicGrid;