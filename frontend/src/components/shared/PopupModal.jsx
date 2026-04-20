// src/components/shared/PopupModal.jsx
import React from 'react';
import { X } from 'lucide-react';

export const PopupModal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  children, 
  maxWidth = "max-w-md" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay com desfoque */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className={`relative w-full ${maxWidth} bg-panel-bg rounded-panel shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
        
        {/* Header Genérico */}
        <div className="bg-panel-header p-4 flex justify-between items-center border-b border-black/5">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-zinc-800" />}
            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-800">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-black/5 rounded-full transition-colors text-zinc-500 hover:text-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PopupModal;