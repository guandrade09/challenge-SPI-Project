import React from 'react';
import { X } from 'lucide-react';
import { IconButtonModal } from './IconButtonModal';

export const PopupModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-md",
  actions = [], // Array de: { icon: Icon, onClick: fn, label: string }
  theme = "dynamic" // Adicionado fallback seguro para o tema
}) => {
  if (!isOpen) return null;

  const activeThemeClass = `panel-theme-${theme}`;

  return (
    // Injetamos o escopo do tema na raiz do portal/modal fixo
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${activeThemeClass}`}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Ajustado background e bordas usando as variáveis nativas injetadas do tema ativo */}
      <div 
        className={`relative w-full ${maxWidth} rounded-xl shadow-2xl border border-theme-divider overflow-hidden animate-in zoom-in duration-300`}
        style={{ backgroundColor: 'var(--p-bg)', borderColor: 'var(--p-border)' }}
      >
        
        {/* Header: Usa a variável do background de cabeçalho do mapa css */}
        <div 
          className="p-4 flex justify-between items-center border-b"
          style={{ backgroundColor: 'var(--p-header-bg)', borderColor: 'var(--p-border)' }}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-main-theme" />}
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-main-theme">
              {title}
            </h3>
          </div>

          {/* Grupo de Ações */}
          <div className="flex items-center gap-1">
            {actions.map((action, index) => (
              <IconButtonModal
                key={index}
                icon={action.icon}
                onClick={action.onClick}
                title={action.label}
                variant="ghost"
              />
            ))}
            
            {/* Divisor semântico baseado na borda do tema */}
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

        {/* Body */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PopupModal;