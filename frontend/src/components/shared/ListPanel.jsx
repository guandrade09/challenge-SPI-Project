// src/components/shared/ListPanel.jsx
import React from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export const ListPanel = ({ 
  title, 
  isOpen, 
  onClose, 
  children, 
  footer 
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop: Escurece o fundo e fecha ao clicar fora */}
      <div 
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Estrutura do Modal estilo Menu de Contexto */}
      <div className="fixed right-6 top-16 w-72 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl z-[70] overflow-hidden animate-in zoom-in-95 slide-in-from-right-4 duration-200">
        
        {/* Header Modulável */}
        <div className="px-5 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            {title}
          </span>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400 hover:text-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo Dinâmico (Body) */}
        <div className="max-h-[60vh] overflow-y-auto py-2 custom-scrollbar">
          {children}
        </div>

        {/* Rodapé Opcional */}
        {footer && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/30">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default ListPanel;