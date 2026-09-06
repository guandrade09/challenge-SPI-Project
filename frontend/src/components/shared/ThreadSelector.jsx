import { Cpu } from 'lucide-react';
import { THREAD_OPTIONS } from '../../utils/threadOptions';

// Botões de origem das métricas de monitoramento (Backend / Frontend / ML), sempre visíveis.
export const ThreadSelector = ({ currentThread, onChange }) => {
  return (
    <div className="flex items-center gap-1 z-30">
      {THREAD_OPTIONS.map((option) => {
        const isActive = option.id === currentThread;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            title={`Ver métricas: ${option.label}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md border transition-all duration-200 shadow-sm active:scale-95 ${
              isActive
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                : 'border-white/10 bg-neutral-800/80 hover:bg-neutral-700 text-gray-400 hover:text-emerald-300'
            }`}
          >
            <Cpu size={12} className="shrink-0" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThreadSelector;
