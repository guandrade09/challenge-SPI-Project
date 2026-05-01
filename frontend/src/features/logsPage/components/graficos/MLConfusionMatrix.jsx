// src/features/logsPage/components/graficos/MLConfusionMatrix.jsx
import React from 'react';

export const MLConfusionMatrix = ({ data }) => {
  const classes = ['Capacete', 'Colete', 'Oculos'];

  const getCellColor = (actual, predicted, value) => {
    if (value === 0) return 'bg-zinc-50 text-zinc-300';
    if (actual === predicted) {
      if (value > 80) return 'bg-green-600 text-white';
      return 'bg-green-400 text-white';
    } else {
      if (value > 10) return 'bg-orange-500 text-white';
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between p-1">
      {/* Container Principal do Grid */}
      <div className="grid grid-cols-[45px_1fr_1fr_1fr] gap-2 items-center flex-1 h-full w-full">
        
        {/* Header Superior (Predito) */}
        <div></div>
        {classes.map(c => (
          <div key={c} className="text-[7px] md:text-[8px] font-black text-zinc-400 text-center uppercase tracking-tighter">
            {c}
          </div>
        ))}

        {/* Corpo da Matriz */}
        {classes.map(actualLabel => (
          <React.Fragment key={actualLabel}>
            {/* Label Lateral (Real) */}
            <div className="text-[7px] md:text-[8px] font-black text-zinc-400 text-right pr-2 uppercase leading-none">
              {actualLabel}
            </div>
            
            {/* Células */}
            {classes.map(predLabel => {
              const cellData = data.find(d => d.actual === actualLabel && d.predicted === predLabel);
              const value = cellData ? cellData.value : 0;
              return (
                <div 
                  key={`${actualLabel}-${predLabel}`}
                  className={`flex items-center justify-center rounded-lg text-[10px] md:text-xs font-black transition-all hover:scale-105 shadow-sm h-full aspect-square md:aspect-auto ${getCellColor(actualLabel, predLabel, value)}`}
                >
                  {value}%
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Rodapé */}
      <div className="text-[8px] text-zinc-400 font-bold text-center mt-3 tracking-[0.2em] uppercase opacity-70">
        Realidade (Ground Truth)
      </div>
    </div>
  );
};

export default MLConfusionMatrix;