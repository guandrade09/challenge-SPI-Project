import { Fragment } from 'react';

const CLASSES = ['Capacete', 'Colete', 'Oculos'];

const getCellColor = (actual, predicted, value) => {
  if (value === 0) return 'bg-zinc-50 text-zinc-300';
  if (actual === predicted) return value > 80 ? 'bg-green-600 text-white' : 'bg-green-400 text-white';
  return value > 10 ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800 border border-orange-200';
};

export const MLConfusionMatrix = ({ data }) => {
  return (
    <div className="flex flex-col h-full w-full justify-between p-1">
      <div className="grid grid-cols-[45px_1fr_1fr_1fr] gap-2 items-center flex-1 h-full w-full">
        <div />
        {CLASSES.map((c) => (
          <div key={c} className="text-[7px] md:text-[8px] font-black text-zinc-400 text-center uppercase tracking-tighter">
            {c}
          </div>
        ))}

        {CLASSES.map((actualLabel) => (
          <Fragment key={actualLabel}>
            <div className="text-[7px] md:text-[8px] font-black text-zinc-400 text-right pr-2 uppercase leading-none">
              {actualLabel}
            </div>
            {CLASSES.map((predLabel) => {
              const cellData = data.find((d) => d.actual === actualLabel && d.predicted === predLabel);
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
          </Fragment>
        ))}
      </div>

      <div className="text-[8px] text-zinc-400 font-bold text-center mt-3 tracking-[0.2em] uppercase opacity-70">
        Realidade (Ground Truth)
      </div>
    </div>
  );
};

export default MLConfusionMatrix;