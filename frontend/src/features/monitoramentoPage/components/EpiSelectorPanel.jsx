///// src/features/monitoramentoPage/components/EpiSelectorPanel.jsx
import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function EpiSelectorPanel({ epis = [], activeEpi, onToggleEpi }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-5 rounded-xl border border-theme-divider/30 bg-neutral-950/20 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center gap-2 text-theme-muted font-mono text-xs uppercase tracking-widest">
        <ShieldAlert size={16} className="text-theme-accent" />
        <span>Clique em um EPI para injetar o Modelo de IA correspondente</span>
      </div>
      
      <div className="flex flex-wrap gap-2.5 justify-center">
        {epis.map((epi, idx) => {
          const isSelected = activeEpi === epi;
          return (
            <button 
              key={idx} 
              onClick={() => onToggleEpi(epi)}
              className={`px-4 py-1.5 border rounded-xl text-xs font-mono uppercase tracking-wider shadow-md transition-all transform active:scale-95 ${
                isSelected 
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : 'bg-neutral-900 border-theme-divider text-theme-main hover:border-theme-muted'
              }`}
            >
              {epi}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EpiSelectorPanel;