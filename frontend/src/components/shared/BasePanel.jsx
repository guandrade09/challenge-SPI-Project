// src/components/shared/BasePanel.jsx
import React from 'react';

export const BasePanel = ({title, children, headerAction, className = "", isGraf = false }) => {
  return (
    <div className={`w-full bg-panel-bg rounded-panel overflow-hidden shadow-2xl flex flex-col h-full ${className}`}>
      
      {/* Cabeçalho */}
      <div className="bg-panel-header py-3 px-6 flex items-center justify-between shrink-0">
        <span className="text-zinc-800 font-bold text-xs uppercase tracking-widest flex-1 text-center">
          {title}
        </span>
        {headerAction && <div className="ml-2">{headerAction}</div>}
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 p-6 min-h-0 flex flex-col"> 
        {isGraf ? (
          /* Se for gráfico: Renderiza com a moldura branca e padding */
          <div className="w-full h-full bg-white rounded-inner p-4 shadow-inner min-h-0">
            {children}
          </div>
        ) : (
          /* Se não for: Renderiza o conteúdo puro (ex: para logs) */
          <>
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default BasePanel;