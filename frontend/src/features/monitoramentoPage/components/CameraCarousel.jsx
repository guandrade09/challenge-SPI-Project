///// src/features/monitoramentoPage/components/CameraCarousel.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Cpu } from 'lucide-react';

export function CameraCarousel({ cameras, currentIndex, onNext, onPrev, onSelectCamera, activeEpi }) {
  
  const getCardStyle = (index) => {
    if (index === currentIndex) {
      return "z-30 scale-100 opacity-100 border-theme-accent shadow-2xl";
    }
    if (index === (currentIndex - 1 + cameras.length) % cameras.length) {
      return "z-20 scale-75 opacity-30 cursor-pointer translate-x-8";
    }
    if (index === (currentIndex + 1) % cameras.length) {
      return "z-20 scale-75 opacity-30 cursor-pointer -translate-x-8";
    }
    return "z-10 scale-50 opacity-0 pointer-events-none absolute";
  };

  return (
    <div className="relative flex-1 flex items-center justify-center min-h-[500px] w-full gap-2 md:gap-8 overflow-hidden select-none">
      
      {/* Seta Esquerda */}
      <button 
        onClick={onPrev}
        className="absolute left-2 md:left-6 z-40 p-3 rounded-xl bg-neutral-900/60 border border-theme-divider text-theme-main hover:bg-neutral-800 transition-all active:scale-95"
      >
        <ChevronLeft size={24} />
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
              className={`w-[360px] md:w-[640px] flex flex-col rounded-2xl border bg-neutral-900/80 backdrop-blur-md overflow-hidden transition-all duration-500 transform ${styleClass} ${!isCentral ? 'absolute' : ''}`}
              style={{ borderColor: isCentral ? 'var(--p-accent)' : 'var(--p-border)' }}
            >
              {/* Header do Card */}
              <div className="p-4 border-b border-theme-divider/40 flex items-center justify-between bg-neutral-950/40">
                <span className="font-mono text-sm font-bold uppercase tracking-wider text-theme-main truncate max-w-[80%]">
                  {cam.nome}
                </span>
                <span className="font-mono text-[11px] uppercase px-2.5 py-1 rounded bg-neutral-800 text-theme-muted">
                  {cam.setor}
                </span>
              </div>

              {/* Body do Card */}
              <div className="aspect-video w-full bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] bg-neutral-950 flex flex-col items-center justify-center relative group">
                {isCentral ? (
                  <div className="text-center space-y-2 p-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${activeEpi ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                      <p className="font-mono text-xs text-theme-main tracking-widest uppercase font-bold">
                        {activeEpi ? `ML ACTIVE: DETECTANDO ${activeEpi}` : 'RTSP STREAM ACTIVE'}
                      </p>
                    </div>
                    <p className="font-mono text-[10px] text-theme-muted/60">{cam.ip}</p>
                    
                    {activeEpi && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase tracking-wider mt-2 animate-in fade-in zoom-in-95 duration-200">
                        <Cpu size={12} className="animate-spin [animation-duration:3s]" />
                        Análise Estatística Avançada Ativa
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-theme-muted/40 uppercase tracking-widest">Feed em Espera</p>
                )}

                {isCentral && (
                  <button className="absolute bottom-4 right-4 p-2 rounded-lg bg-neutral-900/80 border border-theme-divider/60 text-theme-muted hover:text-theme-main opacity-0 group-hover:opacity-100 transition-opacity">
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
        className="absolute right-2 md:right-6 z-40 p-3 rounded-xl bg-neutral-900/60 border border-theme-divider text-theme-main hover:bg-neutral-800 transition-all active:scale-95"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

export default CameraCarousel;