import { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButtonModal } from './IconButtonModal';

export const BasePanelModal = ({
  title,
  children,
  headerAction,
  className = "",
  isGraf = false,
  allowFullScreen = false,
  availableCharts = [],
  theme = "dynamic",
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeThemeClass = `panel-theme-${theme}`;
  const displayTitle = availableCharts.length > 0 ? availableCharts[currentIndex].label : title;

  const toggleMaximize = useCallback(() => setIsMaximized((p) => !p), []);
  const nextChart = useCallback(() => setCurrentIndex((p) => (p + 1) % availableCharts.length), [availableCharts.length]);
  const prevChart = useCallback(() => setCurrentIndex((p) => (p - 1 + availableCharts.length) % availableCharts.length), [availableCharts.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
      if (isMaximized && availableCharts.length > 1) {
        if (e.key === 'ArrowRight') nextChart();
        if (e.key === 'ArrowLeft') prevChart();
      }
    };
    if (isMaximized) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMaximized, availableCharts.length, nextChart, prevChart]);

  // Modificado: Agora aceita uma flag para esticar o container ao máximo no Fullscreen
  const Content = ({ expanded = false }) => (
    <div className={`flex-1 ${expanded ? 'p-6 md:p-8' : 'p-4'} min-h-0 flex flex-col relative w-full h-full`}>
      {isGraf ? (
        <div className="panel-graf-base flex-1 w-full h-full min-h-0 relative">
          {availableCharts.length > 1 && (
            <>
              <IconButtonModal onClick={prevChart} icon={ChevronLeft} variant='ghost' className="absolute left-2 top-1/2 -translate-y-1/2 z-10 panel-btn-toggle" />
              <IconButtonModal onClick={nextChart} icon={ChevronRight} variant='ghost' className="absolute right-2 top-1/2 -translate-y-1/2 z-10 panel-btn-toggle" />
              <div className="absolute bottom-2 right-4 text-[10px] font-mono opacity-50 uppercase tracking-wider panel-text-title">
                {currentIndex + 1} / {availableCharts.length}
              </div>
            </>
          )}
          {/* Garante que o elemento renderizado receba espaço total */}
          <div className="w-full h-full min-h-0 flex-1">
            {availableCharts.length > 0 ? availableCharts[currentIndex].component : children}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col w-full h-full">
          {availableCharts.length > 0 ? availableCharts[0].component : children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`${activeThemeClass} h-full w-full flex flex-col`}>
      {/* Estado Normal do Painel */}
      <div className={`panel-base flex flex-col h-full w-full min-h-0 ${className}`}>
        <div className="panel-header-base">
          <span className="font-mono text-xs font-bold uppercase tracking-wider panel-text-title">{displayTitle}</span>
          <div className="absolute right-4 flex items-center gap-2">
            {headerAction && <div>{headerAction}</div>}
            {allowFullScreen && (
              <button onClick={toggleMaximize} className="p-1.5 rounded-lg transition-all active:scale-95 panel-btn-toggle">
                <Maximize2 size={15} />
              </button>
            )}
          </div>
        </div>
        <Content />
      </div>

      {/* Modal Fullscreen Corrigido */}
      {allowFullScreen && isMaximized && (
        <div 
          className="fixed inset-0 z-[9999] backdrop-blur-sm p-4 md:p-8 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]" 
          style={{ backgroundColor: 'var(--p-overlay)' }} 
          onClick={toggleMaximize}
        >
          {/* Mudança: O container interno agora força flex-col e h-full para não achatar o Recharts */}
          <div 
            className="w-full h-full max-w-[1600px] panel-base flex flex-col min-h-0 overflow-hidden animate-[zoomIn_0.25s_ease-out]" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header-base py-4 px-6 md:px-8 shrink-0">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold uppercase tracking-widest panel-text-title">{displayTitle}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider mt-0.5 panel-text-sub">
                  {theme === 'dynamic' ? 'Modo de Performance Industrial' : 'Painel de Monitoramento Ampliado'}
                </span>
              </div>
              <button 
                onClick={toggleMaximize} 
                className="flex items-center gap-2 px-4 py-2 border rounded-xl transition-all shadow-sm active:scale-95 group panel-btn-toggle"
                style={{ borderColor: 'var(--p-border)', backgroundColor: 'var(--p-header-bg)' }}
              >
                <Minimize2 size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-mono font-bold uppercase tracking-wide">Sair</span>
              </button>
            </div>
            
            {/* Correção da Borda e Espaço: Eliminada a div transparente redundante e forçado flex-1 min-h-0 */}
            <Content expanded />
          </div>
        </div>
      )}
    </div>
  );
};

export default BasePanelModal;