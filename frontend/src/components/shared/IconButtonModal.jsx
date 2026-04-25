// src/components/shared/IconButton.jsx
import React from 'react';

export const IconButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  className = "", 
  variant = "full", // "full" ou "ghost"
  title 
}) => {
  
  // Estilo para o botão grande (IA Style)
  const fullStyles = "flex items-center justify-between w-full p-4 bg-white hover:bg-zinc-50 rounded-2xl shadow-md border-l-4 border-panel-header active:scale-95";
  
  // Estilo para o botão pequeno (Settings Style)
  const ghostStyles = "p-1.5 hover:bg-black/10 rounded-lg text-zinc-800";

  return (
    <button 
      onClick={onClick}
      title={title || label}
      className={`group transition-all duration-300 ${variant === 'full' ? fullStyles : ghostStyles} ${className}`}
    >
      <div className={`${variant === 'full' ? 'text-panel-header group-hover:scale-110' : ''} transition-transform`}>
        <Icon size={variant === 'full' ? 24 : 18} />
      </div>

      {label && variant === 'full' && (
        <>
          <span className="text-zinc-700 font-bold text-xs uppercase tracking-widest">
            {label}
          </span>
          <div className="w-6" /> {/* Spacer */}
        </>
      )}
    </button>
  );
};

export default IconButton;