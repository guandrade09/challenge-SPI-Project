// src/components/shared/BasePanel.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Adicionamos useEffect e useCallback
import { Maximize2, Minimize2 } from 'lucide-react';

export const BasePanel = ({ 
  title, 
  children, 
  headerAction, 
  className = "", 
  isGraf = false, 
  allowFullScreen = false 
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Usamos useCallback para garantir que a função seja estável e não crie novos listeners desnecessários
  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  // Effect para capturar a tecla ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };

    if (isMaximized) {
      window.addEventListener('keydown', handleKeyDown);
      // Boa prática: impedir o scroll do fundo quando o modal está aberto
      document.body.style.overflow = 'hidden';
    }

    // Limpeza (Cleanup) do listener quando o componente desmonta ou o modal fecha
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMaximized]);

  const Content = () => (
    <div className={`flex-1 ${isMaximized ? 'p-10' : 'p-6'} min-h-0 flex flex-col`}>
      {isGraf ? (
        <div className="w-full h-full bg-white rounded-inner p-4 shadow-inner min-h-0">
          {children}
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );

  return (
    <>
      {/* PAINEL NORMAL */}
      <div className={`w-full bg-panel-bg rounded-panel overflow-hidden shadow-2xl flex flex-col h-full ${className}`}>
        <div className="bg-panel-header py-3 px-6 flex items-center justify-between shrink-0 relative">
          <span className="text-zinc-800 font-bold text-xs uppercase tracking-widest flex-1 text-center">
            {title}
          </span>

          <div className="absolute right-4 flex items-center gap-2">
            {headerAction && <div>{headerAction}</div>}
            {allowFullScreen && (
              <button 
                onClick={toggleMaximize}
                className="p-1.5 hover:bg-black/5 rounded-md transition-colors text-zinc-500 hover:text-zinc-800"
              >
                <Maximize2 size={16} />
              </button>
            )}
          </div>
        </div>
        <Content />
      </div>

      {/* MODAL DE TELA CHEIA */}
      {allowFullScreen && isMaximized && (
        <div 
          className="fixed inset-0 z-[9999] bg-neutral-950/90 backdrop-blur-sm p-8 flex items-center justify-center animate-in fade-in duration-200"
          // Opcional: fechar ao clicar no fundo escuro (overlay)
          onClick={toggleMaximize}
        >
          <div 
            className="w-full h-full max-w-[1600px] bg-panel-bg rounded-panel shadow-2xl flex flex-col animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()} // Impede que o clique no gráfico feche o modal
          >
            <div className="bg-panel-header py-4 px-8 flex items-center justify-between shrink-0">
              <span className="text-zinc-800 font-bold text-sm uppercase tracking-widest flex-1 text-center">
                {title} - Visualização Ampliada
              </span>
              <button 
                onClick={toggleMaximize}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
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