// src/components/ui/Badge.jsx
import React from 'react';

export function Badge({ variant = "default", children, className = "" }) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border transition-colors";
  
  const variantStyles = {
    default: "badge-theme-industrial",
    secondary: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    destructive: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    neutral: "bg-neutral-800 text-neutral-300 border-neutral-700"
  };

  const activeStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span className={`${baseStyles} ${activeStyle} ${className}`}>
      {children}
    </span>
  );
}

// Helpers utilitários reutilizáveis baseados no Badge
export function ConfidenceBadge({ value }) {
  if (value === undefined || value === null) return null;
  const num = parseFloat(value);
  const pct = Math.round(num > 1 ? num : num * 100);
  
  let variant = "destructive";
  if (pct >= 85) variant = "secondary";
  else if (pct >= 60) variant = "warning";

  return <Badge variant={variant}>{pct}%</Badge>;
}

export function SourceBadge({ source }) {
  if (!source) return null;
  return <Badge variant="neutral">{source}</Badge>;
}

export default Badge;