import React from 'react';
import { Check, ShieldCheck, ScanEye } from 'lucide-react';

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  return (
    <div 
      onClick={onToggle} 
      className={`detection-card ${
        isChecked 
          ? 'detection-card--checked bg-[var(--p-header-bg)] border-[var(--p-subtext)] shadow-md ring-1 ring-[var(--p-subtext)]/40' 
          : 'detection-card--unchecked bg-[var(--p-bg)] border-theme-divider hover:border-[var(--p-border)]'
      }`}
    >
      {/* 1. Indicador Neon Lateral */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300 ${
          isChecked 
            ? 'bg-[var(--p-subtext)] shadow-[0_0_8px_var(--p-subtext)]' 
            : 'bg-transparent group-hover:bg-[var(--p-border)]'
        }`}
      />

      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* 2. Checkbox Interativo */}
        <div
          className={`flex items-center justify-center shrink-0 rounded-md w-4 h-4 border transition-all duration-200 ${
            isChecked 
              ? 'bg-[var(--p-subtext)] border-[var(--p-subtext)] text-black font-bold shadow-[0_0_6px_var(--p-subtext)] scale-105' 
              : 'bg-[var(--p-header-bg)] border-theme-divider text-transparent group-hover:border-[var(--p-border)]'
          }`}
        >
          <Check size={11} strokeWidth={3} />
        </div>

        {/* 3. Ícone Contextual */}
        <div className={`transition-colors duration-200 shrink-0 ${isChecked ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-title'}`}>
          {isChecked ? <ShieldCheck size={15} /> : <ScanEye size={15} />}
        </div>

        {/* 4. Rótulo */}
        <span className={`flex-1 min-w-0 font-theme-title text-theme-head text-[11px] sm:text-[12px] truncate ${
          isChecked ? 'text-theme-title' : 'text-theme-muted group-hover:text-theme-title'
        }`}>
          {label}
        </span>
      </div>

      {/* 5. Status Badge Dinâmico */}
      <div className="shrink-0">
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase transition-all duration-200 flex items-center gap-1 ${
            isChecked 
              ? 'bg-[var(--p-subtext)]/20 border border-[var(--p-subtext)]/60 text-theme-accent font-semibold' 
              : 'badge-theme-industrial text-theme-muted'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-[var(--p-subtext)] animate-pulse' : 'bg-neutral-500'}`} />
          {isChecked ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
};

export default DetectionCard;