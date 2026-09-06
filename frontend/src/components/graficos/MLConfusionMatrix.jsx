import { Fragment } from 'react';

const CLASSES = ['Capacete', 'Colete', 'Oculos'];

// Função ajustada para ler o tema e injetar cores baseadas em variáveis semânticas
const getCellClasses = (actual, predicted, value, theme) => {
  // Célula vazia / Sem ocorrências
  if (value === 0) {
    return theme === 'dynamic'
      ? 'bg-zinc-900 text-zinc-700 border border-zinc-800'
      : 'bg-neutral-100 text-neutral-300 dark:bg-neutral-800/30 dark:text-neutral-700';
  }

  // Diagonal Principal: Acertos do modelo de ML (True Positives / True Negatives)
  if (actual === predicted) {
    if (theme === 'dynamic') {
      return value > 80 
        ? 'bg-zinc-100 text-zinc-950 font-black' 
        : 'bg-zinc-400 text-zinc-950';
    }
    return value > 80 ? 'bg-green-600 text-white' : 'bg-green-500 text-white';
  }

  // Erros de predição: Falsos Positivos / Falsos Negativos (Confusão do Modelo)
  if (theme === 'dynamic') {
    return value > 10 
      ? 'bg-zinc-800 text-orange-400 border border-orange-500/30' 
      : 'bg-zinc-900 text-orange-200/50';
  }
  return value > 10 
    ? 'bg-orange-500 text-white' 
    : 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/20';
};

export const MLConfusionMatrix = ({ data, theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full justify-between p-1`}>
      {/* Container de Grid adaptado para ler variações de cor de borda nativas */}
      <div className="grid grid-cols-[50px_1fr_1fr_1fr] gap-2 items-center flex-1 h-full w-full">
        {/* Canto superior esquerdo morto da matriz */}
        <div className="text-[7px] font-mono uppercase opacity-40 text-center panel-text-title leading-none">
          Predito
        </div>
        
        {/* Headers das Colunas (Predito) */}
        {CLASSES.map((c) => (
          <div key={c} className="text-[7px] md:text-[8px] font-black text-center uppercase tracking-wider panel-text-sub">
            {c}
          </div>
        ))}

        {/* Linhas da Matriz (Realidade) */}
        {CLASSES.map((actualLabel) => (
          <Fragment key={actualLabel}>
            {/* Header da Linha */}
            <div className="text-[7px] md:text-[8px] font-black text-right pr-2 uppercase leading-none panel-text-sub">
              {actualLabel}
            </div>
            
            {/* Células de dados */}
            {CLASSES.map((predLabel) => {
              const cellData = data.find((d) => d.actual === actualLabel && d.predicted === predLabel);
              const value = cellData ? cellData.value : 0;
              
              return (
                <div
                  key={`${actualLabel}-${predLabel}`}
                  className={`flex items-center justify-center rounded-xl text-[10px] md:text-xs font-bold transition-all duration-200 hover:scale-[1.03] shadow-sm h-full aspect-square md:aspect-auto ${getCellClasses(actualLabel, predLabel, value, theme)}`}
                >
                  {value}%
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Rótulo inferior da matriz */}
      <div className="text-[8px] font-bold text-center mt-3 tracking-[0.2em] uppercase panel-text-title">
        Realidade (Ground Truth)
      </div>
    </div>
  );
};

export default MLConfusionMatrix;