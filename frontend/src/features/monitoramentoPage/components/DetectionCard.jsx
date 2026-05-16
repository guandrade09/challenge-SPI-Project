import React from 'react';

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  const cardClass = isChecked
    ? 'detection-card detection-card--checked'
    : 'detection-card detection-card--unchecked';

  return (
    <div onClick={onToggle} className={cardClass}>
      {/* Detalhe da Borda Lateral Esquerda (Fica verde vivo no estado ativo) */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] rounded-l-lg transition-colors duration-200 ${
          isChecked ? 'bg-[#3cc87a]' : 'bg-transparent'
        }`}
      />

      {/* Caixa do Checkbox personalizado */}
      <div
        className={`flex items-center justify-center shrink-0 rounded w-[18px] h-[18px] border transition-all duration-150 ${
          isChecked 
            ? 'bg-[#3cc87a] border-[#3cc87a]' 
            : 'bg-transparent border-[#3d4050]'
        }`}
      >
        {isChecked && <CheckIcon />}
      </div>

      {/* Rótulo da Classe (Acompanha o tom verde do botão pressionado) */}
      <span
        className={`shrink-0 font-bold text-[13px] tracking-[0.14em] uppercase transition-colors duration-150 ${
          isChecked ? 'text-[#a8f0c6]' : 'text-[#6a6e7a]'
        }`}
        style={{ fontFamily: "'Barlow Condensed', 'Barlow', sans-serif" }}
      >
        {label}
      </span>

      {/* Indicador de Estado Lado Direito ("ativo" em verde brilhante sutil) */}
      <span
        className={`ml-auto text-[9px] tracking-[0.08em] uppercase font-mono transition-colors duration-200 ${
          isChecked ? 'text-[#3cc87a]/70' : 'text-transparent'
        }`}
      >
        ativo
      </span>
    </div>
  );
};

export default DetectionCard;