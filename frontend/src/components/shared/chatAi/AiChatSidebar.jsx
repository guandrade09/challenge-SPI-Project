// src/features/logsPage/components/AiChatSidebar.jsx
import React from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useUiStore } from '../../../store/useUiStore';

export const AiChatSidebar = () => {
  const { isAiSidebarOpen, closeAiSidebar } = useUiStore();

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      {isAiSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={closeAiSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full w-96 bg-[#D9D9D9] shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isAiSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Cabeçalho do Chat */}
        <div className="bg-[#B59481] p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Bot size={24} className="text-zinc-800" />
            <h3 className="font-bold text-zinc-800 uppercase tracking-tighter">Diálogo com IA</h3>
          </div>
          <button onClick={closeAiSidebar} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-zinc-700 self-start max-w-[85%]">
            Olá Usuario! Analisei seus logs recentes de IoT. Deseja que eu gere um relatório de alertas e cuidados no Setor 1A ?
          </div>
        </div>

        {/* Input de Mensagem */}
        <div className="p-6 bg-white/50">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Digite sua dúvida..." 
              className="w-full p-4 pr-12 rounded-2xl border-none shadow-inner focus:ring-2 focus:ring-[#B59481] outline-none text-sm"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#B59481] border-black">
              <Send size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};