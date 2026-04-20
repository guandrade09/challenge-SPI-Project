// src/components/shared/IconButton.jsx
import React from 'react';

export const IconButton = ({ icon: Icon, label, onClick, className = "" }) => {
  return (
    <button 
      onClick={onClick}
      className={`group flex items-center justify-between w-full p-4 bg-white hover:bg-zinc-50 rounded-2xl shadow-sm border-l-4 border-panel-header transition-all duration-300 active:scale-95 ${className}`}
    >
      {/* Ícone à esquerda */}
      <div className="text-panel-header group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>

      {/* Texto Centralizado */}
      <span className="text-zinc-700 font-bold text-sm uppercase tracking-wider">
        {label}
      </span>

      {/* Espaçador invisível à direita para manter o texto centralizado */}
      <div className="w-6" /> 
    </button>
  );
};