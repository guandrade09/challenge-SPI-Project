import React from 'react';

export function Avatar({ children }) {
  return (
    <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full">
      {children}
    </div>
  );
}

export function AvatarFallback({ className, children }) {
  return (
    <span className={`flex items-center justify-center w-full h-full text-sm font-medium text-gray-500 ${className}`}>
      {children}
    </span>
  );
}