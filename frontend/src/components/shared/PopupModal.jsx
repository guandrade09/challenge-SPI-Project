import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButtonModal } from './IconButtonModal';

export const PopupModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-md",
  actions = [],
  theme = "dynamic",
  className = ""
}) => {
  if (!isOpen) return null;

  const activeThemeClass = `panel-theme-${theme}`;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 ${activeThemeClass}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-xl shadow-2xl border border-theme-divider overflow-hidden animate-in zoom-in-95 duration-200 ${className}`}
        style={{ backgroundColor: 'var(--p-bg)', borderColor: 'var(--p-border)' }}
      >
        
        {/* Header (Fixo no topo) */}
        <div 
          className="p-3.5 sm:p-4 flex justify-between items-center border-b shrink-0"
          style={{ backgroundColor: 'var(--p-header-bg)', borderColor: 'var(--p-border)' }}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {Icon && <Icon size={18} className="text-main-theme shrink-0" />}
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-main-theme truncate">
              {title}
            </h3>
          </div>

          {/* Grupo de Ações */}
          <div className="flex items-center gap-1 shrink-0">
            {actions.map((action, index) => (
              <IconButtonModal
                key={index}
                icon={action.icon}
                onClick={action.onClick}
                title={action.label}
                variant="ghost"
              />
            ))}
            
            {actions.length > 0 && (
              <div className="w-[1px] h-4 mx-1" style={{ backgroundColor: 'var(--p-border)' }} />
            )}

            <IconButtonModal
              icon={X}
              onClick={onClose}
              title="Fechar"
              variant="ghost"
            />
          </div>
        </div>

        {/* Body (Rola internamente caso o conteúdo ou teclado seja maior que a tela) */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PopupModal;