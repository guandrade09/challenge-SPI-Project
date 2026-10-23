import React from 'react';
import { Sun, ShieldAlert, Moon } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useUiStore();

  // Mapeamento de Configurações Visuais para cada estado
  const themeMap = {
    light: {
      icon: Sun,
      label: 'Light',
      colorClass: 'text-amber-400 group-hover:rotate-45'
    },
    dynamic: {
      icon: ShieldAlert,
      label: 'Dynamic',
      colorClass: 'text-emerald-400 animate-pulse'
    },
    dark: {
      icon: Moon,
      label: 'Dark',
      colorClass: 'text-indigo-400 group-hover:-translate-y-0.5'
    }
  };

  const current = themeMap[theme] || themeMap.dynamic;
  const IconComponent = current.icon;

  return (
    <button
      onClick={toggleTheme}
      title={`Mudar tema (Atual: ${current.label})`}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-neutral-800/50 hover:bg-neutral-800 hover:border-white/20 active:scale-95 transition-all duration-200"
    >
      {/* Container do Ícone com Micro-Animação reativa */}
      <div className={`transition-transform duration-300 ${current.colorClass}`}>
        <IconComponent size={16} strokeWidth={2} />
      </div>

      {/* Label Industrial no padrão do Dashboard */}
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300 min-w-[55px] text-left select-none">
        {current.label}
      </span>
    </button>
  );
};

export default ThemeToggleButton;