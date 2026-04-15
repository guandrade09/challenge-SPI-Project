import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const AlertPanel = ({ message, isCritical = false }) => {
  return (
    <div className="rounded-[50px] overflow-hidden shadow-2xl w-full max-w-[420px] ml-auto mt-12">
      {/* Cabeçalho */}
      <div className={cn(
        "py-6 text-center transition-colors duration-500",
        isCritical ? "bg-red-600 animate-pulse" : "bg-[#FF5C5C]"
      )}>
        <h2 className="text-4xl font-normal tracking-[0.1em] text-white">
          ALERTA
        </h2>
      </div>
      
      {/* Corpo */}
      <div className="bg-[#D9D9D9] p-8 pt-4 min-h-[180px]">
        <span className="text-zinc-800 font-bold text-[13px] uppercase tracking-tighter block border-b border-zinc-400 pb-1 mb-4">
          DESCRIÇÃO:
        </span>
        <p className="text-zinc-700 text-lg font-medium leading-tight italic">
          {message || ""}
        </p>
      </div>
    </div>
  );
};

export default AlertPanel;