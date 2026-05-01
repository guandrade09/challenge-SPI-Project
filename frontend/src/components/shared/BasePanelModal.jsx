// src/components/shared/BasePanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButtonModal'

export const BasePanel = ({ 
  title, 
  children, 
  headerAction = IconButton, 
  className = "", 
  isGraf = false, 
  allowFullScreen = false,
  availableCharts = [] // ADICIONADO: Recebe a lista de componentes
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); // ADICIONADO: Estado para o carrossel

  // Se houver carrossel, usamos o título do gráfico atual, senão o título padrão
  const displayTitle = (availableCharts.length > 0) 
    ? availableCharts[currentIndex].label 
    : title;

  const toggleMaximize = useCallback(() => setIsMaximized(prev => !prev), []);

  // Funções de Navegação
  const nextChart = () => setCurrentIndex((prev) => (prev + 1) % availableCharts.length);
  const prevChart = () => setCurrentIndex((prev) => (prev - 1 + availableCharts.length) % availableCharts.length);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMaximized) setIsMaximized(false);
      // Navegação por teclado em tela cheia
      if (isMaximized && availableCharts.length > 1) {
        if (event.key === 'ArrowRight') nextChart();
        if (event.key === 'ArrowLeft') prevChart();
      }
    };
    if (isMaximized) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMaximized, availableCharts.length]);

  const Content = () => (
    <div className={`flex-1 ${isMaximized ? 'p-10' : 'p-6'} min-h-0 flex flex-col`}>
      {isGraf ? (
        <div className="w-full h-full bg-white rounded-inner p-4 shadow-inner min-h-0 relative group">
          
          {/* Botões de Navegação (Aparecem no Hover) */}
          {availableCharts.length > 1 && (
            <>
              <button onClick={prevChart} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 bg-zinc-100/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ChevronLeft size={20} className="text-zinc-600" />
              </button>
              <button onClick={nextChart} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 bg-zinc-100/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ChevronRight size={20} className="text-zinc-600" />
              </button>
              <div className="absolute bottom-2 right-4 text-[9px] font-mono text-zinc-400">
                {currentIndex + 1} / {availableCharts.length}
              </div>
            </>
          )}

          {/* Renderização do Conteúdo */}
          {availableCharts.length > 0 ? availableCharts[currentIndex].component : children}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
            {availableCharts.length > 0 ? availableCharts[0].component : children}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={`w-full bg-panel-bg rounded-panel overflow-hidden shadow-2xl flex flex-col h-full ${className}`}>
        <div className="bg-panel-header py-3 px-6 flex items-center justify-between shrink-0 relative">
          <span className="font-label-logs">
            {displayTitle}
          </span>
          <div className="absolute right-4 flex items-center gap-2">
            {headerAction && <div>{headerAction}</div>}
            {allowFullScreen && (
              <button onClick={toggleMaximize} className="p-1.5 hover:bg-black/5 rounded-md transition-colors text-zinc-500 hover:text-zinc-800">
                <Maximize2 size={16} />
              </button>
            )}
          </div>
        </div>
        <Content />
      </div>

      {/* MODAL TELA CHEIA */}
      {allowFullScreen && isMaximized && (
        <div className="fixed inset-0 z-[9999] bg-neutral-950/90 backdrop-blur-sm p-8 flex items-center justify-center animate-in fade-in duration-200" onClick={toggleMaximize}>
          <div className="w-full h-full max-w-[1600px] bg-panel-bg rounded-panel shadow-2xl flex flex-col animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="bg-panel-header py-4 px-8 flex items-center justify-between shrink-0">
              <span className="text-zinc-800 font-bold text-sm uppercase tracking-widest flex-1 text-center">
                {displayTitle} - Ampliado
              </span>
              <button onClick={toggleMaximize} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg">
                <Minimize2 size={18} />
                <span className="text-xs font-bold uppercase">Sair</span>
              </button>
            </div>
            <Content />
          </div>
        </div>
      )}
    </>
  );
};

export default BasePanel;