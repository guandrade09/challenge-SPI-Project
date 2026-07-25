// src/features/monitoramentoPage/components/EpiSelectorPanel.jsx
import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function EpiSelectorPanel({ epis = [], activeEpis = [], onToggleEpi, theme = 'dynamic' }) {
  return (
    <div className={`panel-theme-${theme} font-theme-body w-full max-w-4xl mx-auto`}>
      <div className="panel-subcard backdrop-blur-sm flex flex-col items-center justify-center space-y-4 p-5">
        
        {/* Cabeçalho do Seletor */}
        <div className="flex items-center gap-2 text-theme-title text-xs font-semibold uppercase tracking-wider">
          <ShieldAlert size={16} className="text-[var(--p-subtext)]" />
          <span>Clique em algum modelo IA para começar</span>
        </div>
        
        {/* Lista de Botões/Modelos */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          {epis.map((epi) => {
            const isSelected = activeEpis.includes(epi.nome);
            
            return (
              <button 
                key={epi.id} 
                onClick={() => onToggleEpi(epi.nome)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all transform active:scale-95 border ${
                  isSelected 
                    ? 'bg-[var(--p-header-bg)] border-[var(--p-subtext)] text-[var(--p-text)] text-theme-main tracking-wider font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-[var(--p-subtext)]' 
                    : 'animate-pulse bg-[var(--p-bg)] border-[var(--p-border)] text-theme-main text-[var(--p-text)] tracking-wider hover:text-theme-main hover:border-[var(--p-subtext)]'
                }`}
              >
                {epi.nome}
              </button>
            );
          })}

          {epis.length === 0 && (
            <p className="text-xs text-theme-muted">Nenhum modelo IA configurado para esta câmera.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EpiSelectorPanel;