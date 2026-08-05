import React from 'react';

export const IconButtonModal = ({
  tipo = "button",
  icon: Icon,
  label,
  onClick,
  className = "",
  variant = "full", // "full" | "toggle" | etc.
  colorVariant = "default", // "default" | "cancel" | "danger" | "success"
  title,
}) => {
  // Mapeamento dinâmico de cores mantendo retrocompatibilidade
  const colorClasses = {
    default: "icon-btn-full",
    cancel: "icon-btn-cancel",
    danger: "icon-btn-danger",
    success: "icon-btn-success"
  };

  const selectedColorClass = colorClasses[colorVariant] || colorClasses.default;
  const variantClass = variant === 'full' ? selectedColorClass : 'panel-btn-toggle';

  return (
    <button
      type={tipo}
      onClick={onClick}
      title={title || label}
      className={`group p-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${variantClass} ${className}`}
    >
      {/* O ícone herda a cor adequada do estado */}
      <div className={`transition-transform group-hover:scale-110 ${variant === 'full' ? 'text-main-title' : 'text-muted-theme group-hover:text-main-theme'}`}>
        {Icon && <Icon size={variant === 'full' ? 18 : 15} />}
      </div>

      {label && variant === 'full' && (
        <span className="text-[11px] uppercase tracking-widest font-semibold">
          {label}
        </span>
      )}
    </button>
  );
};

export default IconButtonModal;