import React from 'react';
import { Check, ShieldCheck, ScanEye } from 'lucide-react';

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  return (
    <div 
      onClick={onToggle} 
      className={`group relative flex items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200 overflow-hidden h-full min-h-[48px] sm:min-h-[52px] ${
        isChecked 
          ? 'bg-[var(--p-header-bg)] border-[var(--p-subtext)] shadow-md ring-1 ring-[var(--p-subtext)]/40' 
          : 'bg-[var(--p-bg)] dark:bg-neutral-900/95 light:bg-white border-theme-divider hover:border-neutral-400'
      }`}
    >
      {/* 1. Efeito de Glow Neon na Borda Esquerda */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] sm:w-[4px] rounded-l-xl transition-all duration-300 ${
          isChecked 
            ? 'bg-[var(--p-subtext)] shadow-[0_0_10px_var(--p-subtext)]' 
            : 'bg-transparent group-hover:bg-neutral-500'
        }`}
      />

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* 2. Checkbox Interativo */}
        <div
          className={`flex items-center justify-center shrink-0 rounded-lg w-4 h-4 sm:w-5 sm:h-5 border transition-all duration-200 ${
            isChecked 
              ? 'bg-[var(--p-subtext)] border-[var(--p-subtext)] text-black font-bold shadow-[0_0_8px_var(--p-subtext)] scale-105' 
              : 'bg-neutral-800/80 dark:bg-neutral-800 light:bg-neutral-100 border-theme-divider text-transparent group-hover:border-neutral-400'
          }`}
        >
          <Check size={12} strokeWidth={3} className="sm:w-[13px] sm:h-[13px]" />
        </div>

        {/* 3. Ícone Contextual */}
        <div className={`transition-colors duration-200 shrink-0 ${isChecked ? 'text-[var(--p-subtext)]' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
          {isChecked ? <ShieldCheck size={15} className="sm:w-4 sm:h-4" /> : <ScanEye size={15} className="sm:w-4 sm:h-4" />}
        </div>

        {/* 4. Rótulo */}
        <span
          className={`shrink-0 font-bold text-[11px] sm:text-[12px] tracking-[0.1em] sm:tracking-[0.14em] uppercase transition-colors duration-200 truncate ${
            isChecked ? 'text-theme-title' : 'text-neutral-300 dark:text-neutral-300 light:text-neutral-700 group-hover:text-theme-title'
          }`}
          style={{ fontFamily: "'Barlow Condensed', 'Barlow', sans-serif" }}
        >
          {label}
        </span>
      </div>

      {/* 5. Status Badge Dinâmico */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <span
          className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono tracking-widest uppercase transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${
            isChecked 
              ? 'bg-[var(--p-subtext)]/20 border border-[var(--p-subtext)]/60 text-[var(--p-subtext)] font-semibold' 
              : 'border border-theme-divider bg-neutral-800/50 dark:bg-neutral-800/50 light:bg-neutral-200 text-neutral-400 text-[8px]'
          }`}
        >
          <span className={`w-1.2 h-1.2 sm:w-1.5 sm:h-1.5 rounded-full ${isChecked ? 'bg-[var(--p-subtext)] animate-pulse' : 'bg-neutral-500'}`} />
          {isChecked ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
};

export default DetectionCard;