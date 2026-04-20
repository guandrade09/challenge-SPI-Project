// src/features/logsPage/components/MessageConsole.jsx
import React from 'react';
import { FileArchive, Download, LogsIcon } from 'lucide-react';

export const MessageConsole = ({ title, message }) => {
  return (
    // h-full garante que ele use o espaço do pai
    <div className="w-full bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-full">
      
      {/* Cabeçalho fixo */}
      <div className="bg-[#B59481] py-6 text-center shrink-0">
        <span className='text-zinc-800 font-bold text-xs uppercase tracking-widest'>
          {title || `Gerador de Relatorio (IA)`}
        </span>
      </div>

      {/* Conteúdo flexível */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        
        {/* A caixa branca agora é flex-1 e min-h-0 para forçar o scroll interno */}
        <div className="flex-1 bg-white p-6 rounded-[30px] shadow-sm mb-6 overflow-y-auto min-h-0">
          <p className="text-zinc-700 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Botões sempre no rodapé */}
        <div className="flex gap-4 shrink-0">
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