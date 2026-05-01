// src/features/logsPage/components/AiChatSidebar.jsx
import React, { useEffect } from 'react'; // Não esqueça de importar o useEffect
import { X, Send, Bot } from 'lucide-react';
import { useUiStore } from '../../../store/useUiStore';

export const AiChatSidebar = () => {
  const { isAiSidebarOpen, closeAiSidebar } = useUiStore();

  // Listener para a tecla ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isAiSidebarOpen) {
        closeAiSidebar();
      }
    };

    // Só adicionamos o event listener se a sidebar estiver aberta
    if (isAiSidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup: remove o listener quando o componente desmonta ou a sidebar fecha
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAiSidebarOpen, closeAiSidebar]);

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      {isAiSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm animate-in fade-in duration-300" 
          onClick={closeAiSidebar} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full w-96 bg-[#D9D9D9] shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isAiSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Cabeçalho */}
        <div className="bg-[#B59481] p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-zinc-800">
            <Bot size={24} />
            <h3 className="font-bold uppercase tracking-tighter">Diálogo com IA</h3>
          </div>
          <button 
            onClick={closeAiSidebar} 
            className="p-2 hover:bg-black/10 rounded-full transition-colors text-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-zinc-700 self-start max-w-[85%]">
            Olá Gabriel! Analisei seus logs recentes de IoT. Deseja que eu gere um relatório de alertas no Setor 1A?
          </div>
        </div>

        {/* Input */}
        <div className="p-6 bg-white/50 border-t border-zinc-200">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Digite sua dúvida..." 
              className="w-full p-4 pr-12 rounded-2xl border-none shadow-inner focus:ring-2 focus:ring-[#B59481] outline-none text-sm text-black"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#B59481] hover:scale-110 transition-transform">
              <Send size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AiChatSidebar;