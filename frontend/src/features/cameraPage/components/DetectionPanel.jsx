// DetectionPanel.jsx
import React from 'react';
import { Target, Check, Trash2 } from 'lucide-react';
import { DetectionCard } from './DetectionCard';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

export const DetectionPanel = ({ 
  options, 
  isEditingRiskArea, 
  setIsEditingRiskArea, 
  hasRiskArea,
  onClearRiskArea,
  onToggleEpi // <-- Adicionado callback
}) => {
  const { detections } = useMonitoramentoStore();

  return (
    <div className="flex flex-col gap-3 w-full h-full justify-between">
      {/* Lista de Checkboxes de EPIs */}
      <div className="flex flex-col gap-2 w-full">
        {options.map((option) => (
          <DetectionCard
            key={option.id}
            label={option.label}
            isChecked={!!detections[option.id]}
            onToggle={() => onToggleEpi(option.id)} // <-- Chama o handler corrigido
          />
        ))}
      </div>

      {/* SEÇÃO DE CONTROLE DA ÁREA DE RISCO */}
      <div className="pt-2 border-t border-theme-divider flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
          Zonas de Alerta
        </span>

        {!isEditingRiskArea ? (
          <button
            onClick={() => setIsEditingRiskArea(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-md"
          >
            <Target size={15} className="text-amber-400" />
            <span>{hasRiskArea ? 'Editar Área de Risco' : 'Delimitar Área de Risco'}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsEditingRiskArea(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
              title="Fixar a delimitação atual"
            >
              <Check size={14} />
              <span>Salvar</span>
            </button>

            <button
              onClick={onClearRiskArea}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95"
              title="Remover a área delimitada"
            >
              <Trash2 size={14} />
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionPanel;