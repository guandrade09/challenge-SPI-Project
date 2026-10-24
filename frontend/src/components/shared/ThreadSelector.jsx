import { THREAD_OPTIONS } from '../../utils/threadOptions';

// Botões de origem das métricas de monitoramento (Backend / Frontend / ML), sempre visíveis.
export const ThreadSelector = ({ currentThread, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Selecionar origem dos recursos do sistema">
      {THREAD_OPTIONS.map((option) => {
        const isActive = option.id === currentThread;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            title={`Ver métricas: ${option.label}`}
            className={`rounded-lg border border-theme-divider px-2.5 py-1.5 text-xs transition-colors ${
              isActive
                ? 'panel-btn-toggle font-bold'
                : 'text-[var(--p-text-logs)] hover:opacity-80'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThreadSelector;
