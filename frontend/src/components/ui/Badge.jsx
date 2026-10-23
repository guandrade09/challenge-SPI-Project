import React from 'react';

export function Badge({ variant = "default", children, className = "" }) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border transition-colors";
  
  const variantStyles = {
    default: "badge-theme-industrial",
    secondary: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    destructive: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  // Garante um fallback caso uma variante inexistente seja passada
  const activeStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span className={`${baseStyles} ${activeStyle} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;