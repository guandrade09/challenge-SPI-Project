import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { IconButtonModal } from './IconButtonModal';
import { useUiStore } from '../../../store/useUiStore';

export function ExpandButton({ isMaximized, onClick, className = "" }) {
  const currentTheme = useUiStore((s) => s.theme);
  const isDark = currentTheme === 'dark';

  return (
    <IconButtonModal
      icon={isMaximized ? Minimize2 : Maximize2}
      variant="ghost"
      onClick={onClick}
      label={isMaximized ? "Minimizar" : "Expandir"}
      className={`transition-colors ${
        isDark 
          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
      } ${className}`}
    />
  );
}