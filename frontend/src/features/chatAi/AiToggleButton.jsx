import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export const AiToggleButton = ({ theme = 'dark' }) => {
  const { isAiSidebarOpen, toggleAiSidebar } = useUiStore();

  return (
    <button
      onClick={toggleAiSidebar}
      title={isAiSidebarOpen ? "Fechar Assistente de IA" : "Abrir Assistente de IA"}
      className={`panel-theme-${theme} fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full border border-[var(--p-border)] bg-[var(--p-button-bg)] text-[var(--p-text)] shadow-2xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 group ${
        isAiSidebarOpen 
          ? 'opacity-0 scale-75 pointer-events-none translate-y-4' 
          : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <Bot size={22} className="group-hover:rotate-12 transition-transform duration-300 text-[var(--p-toggle-accent,#34d399)]" />
        <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
      </div>
      
      <span className="text-xs font-theme-title font-semibold uppercase tracking-wider hidden sm:inline-block">
        IA Assistente
      </span>
    </button>
  );
};