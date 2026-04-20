// src/features/logsPage/components/AiToggleButton.jsx
import React from 'react';
import { Bot } from 'lucide-react';
import { useUiStore } from '../../../store/useUiStore';

export const AiToggleButton = () => {
  // Pegamos a função de abrir do nosso Store
  const toggleAiSidebar = useUiStore((state) => state.toggleAiSidebar);

  return (
    <button 
      onClick={toggleAiSidebar}
      className="group flex items-center justify-between w-full p-4 bg-white hover:bg-zinc-50 rounded-2xl shadow-md border-l-4 border-[#B59481] transition-all active:scale-95"
    >
      <Bot size={24} className="text-[#B59481] group-hover:scale-110 transition-transform" />
      
      <span className="text-zinc-700 font-bold text-xs uppercase tracking-widest">
        Falar com Assistente IA
      </span>

      <div className="w-6" /> {/* Spacer para manter o texto centralizado */}
    </button>
  );
};