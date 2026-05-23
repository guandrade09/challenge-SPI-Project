import React from 'react';

export const IconButtonModal = ({
  icon: Icon,
  label,
  onClick,
  className = "",
  variant = "full",
  title,
}) => {
  // Vincula dinamicamente a variante com as classes globais do seu index.css
  const variantClass = variant === 'full' ? 'icon-btn-full' : 'panel-btn-toggle';

  return (
    <button
      onClick={onClick}
      title={title || label}
      className={`group p-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 ${variantClass} ${className}`}
    >
      {/* O ícone herda a cor do texto principal do tema ativo */}
      <div className={`transition-transform group-hover:scale-110 ${variant === 'full' ? 'text-main-theme' : 'text-muted-theme group-hover:text-main-theme'}`}>
        <Icon size={variant === 'full' ? 20 : 15} />
      </div>

      {/* Label corrigido para usar text-main-theme em vez de zinc-700 */}
      {label && variant === 'full' && (
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-main-theme">
          {label}
        </span>
      )}
    </button>
  );
};

export default IconButtonModal;