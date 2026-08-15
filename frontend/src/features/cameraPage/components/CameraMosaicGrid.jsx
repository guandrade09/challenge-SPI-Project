// src/features/monitoramentoPage/components/CameraMosaicGrid.jsx
import React from 'react';
import { Video, CheckCircle2 } from 'lucide-react';

export function CameraMosaicGrid({ cameras, currentIndex, onSelectCamera }) {
  if (!cameras || cameras.length <= 1) return null;

  return (
    <div className="w-full flex flex-col gap-2 mt-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-theme-head">
          MOSAICO DE CÂMERAS ({cameras.length})
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
          Clique em um card para alternar a câmera principal
        </span>
      </div>

      {/* Grid de Miniautras Responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full">
        {cameras.map((cam, idx) => {
          const isActive = idx === currentIndex;

          return (
            <button
              key={cam.id || idx}
              onClick={() => onSelectCamera(idx)}
              className={`group relative flex flex-col justify-between p-2.5 rounded-xl border transition-all duration-200 text-left overflow-hidden ${
                isActive
                  ? 'bg-[var(--p-header-bg)] border-[var(--p-subtext)] shadow-lg ring-1 ring-[var(--p-subtext)] scale-[1.02]'
                  : 'bg-theme-section border-theme-divider hover:border-neutral-500 hover:bg-[var(--p-header-bg)] opacity-70 hover:opacity-100'
              }`}
            >
              {/* Header do Card Miniatura */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold font-mono text-theme-title truncate max-w-[80%]">
                  {cam.nome || `CAM-${idx + 1}`}
                </span>
                {isActive ? (
                  <CheckCircle2 size={14} className="text-[var(--p-subtext)] shrink-0" />
                ) : (
                  <Video size={14} className="text-neutral-500 group-hover:text-theme-title shrink-0 transition-colors" />
                )}
              </div>

              {/* Visor de Preview do Mosaico (Placeholder de Vídeo) */}
              <div className="w-full h-16 rounded-lg bg-[var(--p-graf-bg)] border border-theme-divider flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                
                {/* Indicador Óptico */}
                <div className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 z-20 ${isActive ? 'bg-[var(--p-subtext)] animate-pulse' : 'bg-neutral-600'}`} />

                <span className="text-[10px] font-mono text-neutral-400 z-20 font-bold uppercase tracking-wider">
                  {cam.setor || 'CCTV'}
                </span>
              </div>

              {/* IP / Identificador no Footer */}
              <span className="text-[9px] font-mono text-neutral-500 mt-1.5 truncate w-full">
                {cam.ip || `ID: ${cam.id}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CameraMosaicGrid;