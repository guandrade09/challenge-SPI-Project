// src/features/logsPage/components/graficos/MLConfusionMatrix.jsx
import React from 'react';
import { BasePanel } from '../../../../components/shared/BasePanel';

export const MLConfusionMatrix = ({ title, data }) => {
  const classes = ['Capacete', 'Colete', 'Oculos'];

  // Função para definir a cor baseada no valor (Acertos em verde, Erros em tons de marrom/cinza)
  const getCellColor = (actual, predicted, value) => {
    if (value === 0) return 'bg-zinc-50 text-zinc-300';
    
    if (actual === predicted) {
      // Diagonal Principal (Acertos)
      if (value > 80) return 'bg-green-600 text-white';
      return 'bg-green-400 text-white';
    } else {
      // Fora da diagonal (Confusões/Erros)
      if (value > 10) return 'bg-orange-500 text-white';
      return 'bg-orange-100 text-orange-800';
    }
  };

  return (
      <div className="flex flex-col h-full w-full justify-center p-2">

        <div className="grid grid-cols-[30px_1fr_1fr_1fr] gap-1 flex-1">
          {/* Espaço vazio no canto */}
          <div></div>
          {classes.map(c => (
            <div key={c} className="text-[9px] font-bold text-zinc-500 text-center uppercase">{c}</div>
          ))}

          {/* Linhas da Matriz */}
          {classes.map(actualLabel => (
            <React.Fragment key={actualLabel}>
              {/* Label Lateral (Realidade) */}
              <div className="text-[9px] font-bold text-zinc-500 flex items-center justify-end pr-2 uppercase vertical-text">
                {actualLabel}
              </div>
              
              {/* Células de Dados */}
              {classes.map(predLabel => {
                const cellData = data.find(d => d.actual === actualLabel && d.predicted === predLabel);
                const value = cellData ? cellData.value : 0;
                return (
                  <div 
                    key={`${actualLabel}-${predLabel}`}
                    className={`flex items-center justify-center rounded-md text-xs font-bold transition-all hover:scale-105 shadow-sm h-full min-h-[40px] ${getCellColor(actualLabel, predLabel, value)}`}
                  >
                    {value}%
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Label de Realidade (Rodapé/Lateral) */}
        <div className="text-[10px] text-zinc-400 font-bold text-center mt-2 tracking-widest uppercase">
          Realidade (Ground Truth)
        </div>
      </div>
  );
};

export default MLConfusionMatrix;