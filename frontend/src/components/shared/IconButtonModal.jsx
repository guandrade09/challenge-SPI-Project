// src/components/shared/IconButtonModal.jsx
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
  showLabel = false, // <-- Propriedade nova para forçar exibição da label
  disabled = false,
}) => {
  const colorClasses = {
    default: "icon-btn-full",
    cancel: "icon-btn-cancel",
    danger: "icon-btn-danger",
    success: "icon-btn-success"
  };

  const selectedColorClass = colorClasses[colorVariant] || colorClasses.default;
  const variantClass = variant === 'full' ? selectedColorClass : 'panel-btn-toggle';
  const isLabelVisible = label && (variant === 'full' || showLabel);

  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`cursor-pointer shadow-md group px-3 py-2 sm:p-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 select-none tracking-wider text-[var(--text-theme-main)] ${variantClass} ${className}`}
    >
      <div className={`transition-transform group-hover:scale-110 shrink-0 ${variant === 'full' ? 'text-main-title' : 'text-muted-theme group-hover:text-main-theme'}`}>
        {Icon && <Icon size={variant === 'full' ? 18 : 15} />}
      </div>

      {isLabelVisible && (
        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest font-semibold whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
};

export default IconButtonModal;