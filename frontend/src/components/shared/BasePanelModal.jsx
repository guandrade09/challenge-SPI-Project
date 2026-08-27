import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButtonModal } from './IconButtonModal';
import { ExpandButton } from './ExpandButton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/Card';
import { useIsMobile } from '../../hooks/useIsMobile';

export const BasePanelModal = ({
  title,
  children,
  headerAction,
  className = "",
  isGraf = false,
  allowFullScreen = false,
  availableCharts = [],
  theme = "dark",
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

  const activeThemeClass = `panel-theme-${theme}`;
  const displayTitle = availableCharts.length > 0 ? availableCharts[currentIndex].label : title;

  const activeHeaderAction = availableCharts.length > 0 
    ? (availableCharts[currentIndex]?.headerAction || headerAction)
    : headerAction;

  const toggleMaximize = useCallback(() => setIsMaximized((p) => !p), []);
  
  const nextChart = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((p) => (p + 1) % availableCharts.length);
  }, [availableCharts.length]);

  const prevChart = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((p) => (p - 1 + availableCharts.length) % availableCharts.length);
  }, [availableCharts.length]);

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

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const renderContent = () => {
    const resolvedChildren = typeof children === 'function' ? children({ isMaximized, isMobile }) : children;

    return (
      <div 
        className="w-full h-full min-h-0 flex flex-col relative" 
        onClick={handleContentClick}
      >
        {isGraf ? (
          <div className="panel-graf-base flex-1 w-full h-full min-h-0 relative hover:border-[var(--p-subtext)]">
            {availableCharts.length > 1 && (
              <>
                {/* Botões com maior hit area no mobile */}
                <IconButtonModal 
                  onClick={prevChart} 
                  icon={ChevronLeft} 
                  variant='ghost' 
                  className={`absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 ${
                    isMobile ? 'p-2 bg-black/40 rounded-full' : ''
                  }`} 
                />
                <IconButtonModal 
                  onClick={nextChart} 
                  icon={ChevronRight} 
                  variant='ghost' 
                  className={`absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 ${
                    isMobile ? 'p-2 bg-black/40 rounded-full' : ''
                  }`} 
                />
                <div className="absolute bottom-1 right-2 md:bottom-2 md:right-4 text-[10px] font-mono opacity-60 uppercase tracking-wider text-main-theme z-20">
                  {currentIndex + 1} / {availableCharts.length}
                </div>
              </>
            )}
            <div className="w-full h-full min-h-0 flex-1">
              {availableCharts.length > 0 ? availableCharts[currentIndex].component : resolvedChildren}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col w-full h-full">
            {availableCharts.length > 0 ? availableCharts[0].component : resolvedChildren}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${activeThemeClass} h-full w-full flex flex-col`}>
      <Card className={`h-full w-full flex flex-col min-h-0 ${className}`}>
        <CardHeader className="relative pr-20 md:pr-24 py-3 px-4">
          <CardTitle className="text-theme-title text-[12px] md:text-[13px] uppercase tracking-wider truncate">
            {displayTitle}
          </CardTitle>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
            {activeHeaderAction && <div>{activeHeaderAction}</div>}
            {allowFullScreen && (
              <ExpandButton isMaximized={isMaximized} onClick={toggleMaximize} />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-2 sm:p-4">
          {renderContent()}
        </CardContent>
      </Card>

      {/* Modal Fullscreen Adaptado para Telas Pequenas */}
      {allowFullScreen && isMaximized && (
        <div 
          className="fixed inset-0 z-[9999] backdrop-blur-sm p-2 sm:p-4 md:p-8 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]" 
          style={{ backgroundColor: 'var(--p-overlay, rgba(0, 0, 0, 0.6))' }} 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleMaximize();
            }
          }}
        >
          <Card 
            className="w-full h-full max-w-[1600px] flex flex-col min-h-0 overflow-hidden animate-[zoomIn_0.25s_ease-out] rounded-lg" 
            onClick={handleContentClick} 
          >
            <CardHeader 
              className="py-3 px-4 md:py-4 md:px-8 flex-row items-center justify-between shrink-0 border-b border-theme-divider gap-2"
              onClick={handleContentClick}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <CardTitle className="text-theme-title text-[12px] md:text-[13px] uppercase tracking-wider truncate">
                  {displayTitle}
                </CardTitle>
                <CardDescription className="text-[var(--p-text)] text-theme-muted uppercase tracking-wider mt-0.5 text-[10px] md:text-xs truncate">
                  {theme === 'dynamic' ? 'Modo de Performance Industrial' : 'Painel Ampliado'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={handleContentClick}>
                {activeHeaderAction && <div>{activeHeaderAction}</div>}
                <ExpandButton
                  isMaximized={isMaximized}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMaximize();
                  }}
                />
              </div>
            </CardHeader>
            
            <CardContent 
              className="flex-1 min-h-0 p-3 sm:p-6 md:p-8 overflow-y-auto"
              onClick={handleContentClick}
            >
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BasePanelModal;