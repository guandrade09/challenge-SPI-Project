import React from 'react';

export const IconButton = ({
  icon: Icon,
  label,
  onClick,
  className = "",
  variant = "full",
  title,
}) => {
  const variantClass = variant === 'full' ? 'icon-btn-full' : 'icon-btn-ghost';

  return (
    <button
      onClick={onClick}
      title={title || label}
      className={`group ${variantClass} ${className}`}
    >
      <div className={variant === 'full' ? 'text-panel-header group-hover:scale-110 transition-transform' : ''}>
        <Icon size={variant === 'full' ? 24 : 18} />
      </div>

      {label && variant === 'full' && (
        <>
          <span className="text-zinc-700 font-bold text-xs uppercase tracking-widest">
            {label}
          </span>
          <div className="w-6" />
        </>
      )}
    </button>
  );
};

export default IconButton;