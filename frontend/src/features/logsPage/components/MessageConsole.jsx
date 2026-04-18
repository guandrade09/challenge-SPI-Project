// src/features/logsPage/components/MessageConsole.jsx
import React from 'react';
import { FileArchive, Download } from 'lucide-react';

export const MessageConsole = ({ title = "RESUMO IA", message }) => {
  return (
    <div className="w-full max-w-md bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-full min-h-[400px]">
      
      {/* Cabeçalho Padronizado (Mesmo estilo do LogPanel e Charts) */}
      <div className="bg-[#B59481] py-6 text-center">
        <h2 className="text-2xl font-normal tracking-widest text-white uppercase">
          {title}
        </h2>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 p-6 flex flex-col">
        
        {/* Box de Mensagem (Seguindo o estilo dos cards de log brancos) */}
        <div className="flex-1 bg-white p-6 rounded-[30px] shadow-sm mb-6 overflow-y-auto">
          {message ? (
            <p className="text-zinc-700 font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          ) : (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-200 rounded w-full"></div>
              <div className="h-4 bg-zinc-200 rounded w-5/6"></div>
              <p className="text-zinc-400 text-xs italic mt-2">Processando resumo através da IA...</p>
            </div>
          )}
        </div>

        {/* Container de Botões */}
        <div className="flex gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#B59481] hover:bg-[#a38372] text-white rounded-2xl transition-all duration-300 shadow-md text-xs font-bold uppercase tracking-wider">
            <FileArchive size={18}/>
            Gerar Relatório
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-50 text-[#B59481] border-2 border-[#B59481] rounded-2xl transition-all duration-300 shadow-md text-xs font-bold uppercase tracking-wider">
            <Download size={18}/>
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageConsole;