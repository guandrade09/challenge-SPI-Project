import React from 'react';

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  return (
    <div 
      onClick={onToggle} 
      className={`detection-card ${
        isChecked 
          ? 'detection-card--checked' 
          : 'detection-card--unchecked'
      }`}
    >
      {/* Detalhe da Borda Lateral Esquerda com o seu efeito de Glow Adaptativo */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-200 ${
          isChecked 
            ? 'bg-theme-accent shadow-[0_0_8px_var(--p-subtext)]' 
            : 'bg-transparent'
        }`}
      />

      {/* Caixa do Checkbox personalizado */}
      <div
        className={`flex items-center justify-center shrink-0 rounded w-[18px] h-[18px] border transition-all duration-150 ${
          isChecked 
            ? 'bg-theme-accent border-theme-accent text-green-50' 
            : 'bg-transparent border-theme-divider text-transparent'
        }`}
      >
        <CheckIcon />
      </div>

      {/* Rótulo da Classe */}
      <span
        className={`shrink-0 font-bold text-[12px] tracking-[0.12em] uppercase transition-colors duration-150 ${
          isChecked ? 'text-theme-accent' : 'text-neutral-400 light:text-neutral-500 panel-text-sub'
        }`}
        style={{ fontFamily: "'Barlow Condensed', 'Barlow', sans-serif" }}
      >
        {label}
      </span>

      {/* Indicador de Estado Lado Direito */}
      <span
        className={`ml-auto text-[9px] tracking-[0.08em] uppercase font-mono transition-all duration-200 ${
          isChecked ? 'text-theme-accent opacity-80 shadow-sm animate-pulse' : 'text-transparent'
        }`}
      >
        ativo
      </span>
    </div>
  );
};

export default DetectionCard;