import React from 'react';

export function Badge({ variant, children, className }) {
  const baseStyles = "inline-flex items-center px-2 py-1 rounded text-sm font-medium";
  const variantStyles = {
    default: "bg-gray-200 text-gray-800",
    secondary: "bg-blue-200 text-blue-800",
    destructive: "bg-red-200 text-red-800",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;