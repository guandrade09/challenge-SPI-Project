// src/features/monitoramentoPage/components/CameraCarousel.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Cpu } from 'lucide-react';

export function CameraCarousel({ cameras, currentIndex, onNext, onPrev, onSelectCamera, activeEpi, theme = 'dynamic' }) {
  
  const getCardStyle = (index) => {
    if (index === currentIndex) {
      return "z-30 scale-100 opacity-100 shadow-2xl";
    }
    if (index === (currentIndex - 1 + cameras.length) % cameras.length) {
      return "z-20 scale-75 opacity-40 cursor-pointer translate-x-8";
    }
    if (index === (currentIndex + 1) % cameras.length) {
      return "z-20 scale-75 opacity-40 cursor-pointer -translate-x-8";
    }
    return "z-10 scale-50 opacity-0 pointer-events-none absolute";
  };

  return (
    <div className={`panel-theme-${theme} font-theme-body relative flex-1 flex items-center justify-center min-h-[480px] w-full gap-2 md:gap-8 overflow-hidden select-none`}>
      
      {/* Seta Esquerda */}
      <button 
        onClick={onPrev}
        className="absolute left-2 md:left-6 z-40 p-3 rounded-xl bg-[var(--p-header-bg)] border border-theme-divider text-theme-main hover:border-[var(--p-subtext)] transition-all active:scale-95 backdrop-blur-md"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Container das Câmeras */}
      <div className="flex items-center justify-center w-full max-w-7xl relative h-full">
        {cameras.map((cam, index) => {
          const styleClass = getCardStyle(index);
          const isCentral = index === currentIndex;

          return (
            <div
              key={cam.id}
              onClick={() => !isCentral && onSelectCamera(index)}
              className={`w-[720px] md:w-[1280px] flex flex-col rounded-2xl border panel-base backdrop-blur-md overflow-hidden transition-all duration-500 transform ${styleClass} ${!isCentral ? 'absolute' : ''}`}
              style={{ borderColor: isCentral ? 'var(--p-subtext)' : 'var(--p-border)' }}
            >
              {/* Header do Card */}
              <div className="p-4 panel-header-base flex items-center justify-between border-b border-theme-divider">
                <span className="text-theme-title text-sm tracking-wider uppercase truncate max-w-[80%]">
                  {`Câmera: ${cam.nome}`}
                </span>
                <span className="text-theme-head animate-pulse text-[11px] px-2.5 py-1 rounded-md badge-theme-industrial">
                  {`Setor: ${cam.setor}`}
                </span>
              </div>

              {/* Body do Card (Visor de Câmera) */}
              <div className="aspect-video panel-body-cam flex flex-col items-center justify-center relative group w-full">
                {isCentral ? (
                  <div className="text-center space-y-2 p-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${activeEpi ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                      <p className="text-theme-title text-sm font-bold tracking-widest uppercase">
                        {activeEpi ? `ML ACTIVE: DETECTANDO ${activeEpi}` : 'AGUARDANDO SELEÇÃO DE IA'}
                      </p>
                    </div>
                    
                    <p className="text-theme-head text-[10px] opacity-70">{cam.ip}</p>
                    
                    {activeEpi && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-theme-industrial text-xs font-semibold uppercase tracking-wider mt-2">
                        <Cpu size={12} className="animate-spin [animation-duration:3s] text-[var(--p-subtext)]" />
                        Visão Computacional Conectada
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-theme-head text-xs opacity-50">Feed em Espera</p>
                )}

                {/* Botão Expandir no Canto */}
                {isCentral && (
                  <button className="absolute bottom-4 right-4 p-2.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main hover:border-[var(--p-subtext)] opacity-0 group-hover:opacity-100 transition-all">
                    <Maximize2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seta Direita */}
      <button 
        onClick={onNext}
        className="absolute right-2 md:right-6 z-40 p-3 rounded-xl bg-[var(--p-header-bg)] border border-theme-divider text-theme-main hover:border-[var(--p-subtext)] transition-all active:scale-95 backdrop-blur-md"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

export default CameraCarousel;