import React from 'react';

export function Button({ variant = 'default', size = 'md', className = "", children, ...props }) {
  const baseStyles = 'inline-flex items-center justify-center font-mono uppercase tracking-wider font-medium rounded-lg transition-all active:scale-95 focus:outline-none disabled:opacity-50';
  
const variantStyles = {
  default: 'icon-btn-full border border-theme-divider',
  outline: 'border border-theme-divider bg-transparent text-main-theme hover:bg-theme-hover',
  ghost: 'bg-transparent text-muted-theme hover:text-main-theme hover:bg-theme-hover',
};

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-6 py-3 text-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;