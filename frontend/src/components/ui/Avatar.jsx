import React from 'react';

export function Avatar({ children, className = "" }) {
  return (
    <div className={`relative inline-flex items-center justify-center w-8 h-8 overflow-hidden rounded-full avatar-theme-base shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function AvatarFallback({ className = "", children }) {
  return (
    <span className={`flex items-center justify-center w-full h-full text-xs font-mono font-medium text-main-theme ${className}`}>
      {children}
    </span>
  );
}