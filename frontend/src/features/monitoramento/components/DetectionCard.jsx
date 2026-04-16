// src/features/monitoramento/components/DetectionCard.jsx
import React from 'react';
import { Square, CheckSquare } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between px-8 py-3 rounded-full rounded-full shadow-xl transition-all duration-200 cursor-pointer w-full max-w-[320px] border border-zinc-200",
        "bg-white hover:bg-zinc-100 active:scale-95 select-none"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="text-zinc-900">
          {isChecked ? (
            <CheckSquare size={20} fill="black" stroke="white" strokeWidth={3} />
          ) : (
            <Square size={20} strokeWidth={3} className="text-zinc-900" />
          )}
        </div>
        <span className="text-zinc-900 font-bold text-[12px] uppercase tracking-[0.15em]">
          {label}
        </span>
      </div>
    </div>
  );
};

export default DetectionCard;