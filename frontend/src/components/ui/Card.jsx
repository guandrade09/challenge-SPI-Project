import React from 'react';

export function Card({ children, className = "" }) {
  return (
    // Usa a identidade .panel-base para injetar var(--p-bg), var(--p-border) e o radius correto
    <div className={`panel-base backdrop-blur-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    // Usa .panel-header-base para injetar var(--p-header-bg) e a linha divisória inferior
    <div className={`panel-header-base ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`p-4 min-h-0 w-full ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    // Aplica a identidade .text-main-theme para puxar a cor var(--p-text) de forma dinâmica
    <h3 className={`text-lg font-semibold text-main-theme ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    // Aplica .text-muted-theme para herdar a cor do texto com a opacidade ideal do tema
    <p className={`text-sm text-muted-theme ${className}`}>
      {children}
    </p>
  );
}