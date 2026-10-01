import React from 'react';

export function Card({ children, className = "" }) {
  return (
    // Usa a identidade .panel-base para injetar var(--p-bg), var(--p-border) e o radius correto
    <div className={`panel-base backdrop-blur-sm overflow-hidden flex flex-col ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    // Usa .panel-header-base para injetar var(--p-header-bg) e a linha divisória inferior
    // shrink-0 impede que o cabeçalho encolha em containers flex sem espaço
    <div className={`panel-header-base shrink-0 transition-all ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    // Padding adaptável: p-3 em celulares, p-4 a partir de telas sm (640px)
    <div className={`p-3 sm:p-4 min-h-0 w-full flex-1 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    // Aplica text-base no mobile e text-lg em telas maiores
    <h3 className={`text-base sm:text-lg font-semibold text-main-theme leading-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    // Aplica text-xs no mobile e text-sm em telas maiores
    <p className={`text-xs sm:text-sm text-muted-theme ${className}`}>
      {children}
    </p>
  );
}