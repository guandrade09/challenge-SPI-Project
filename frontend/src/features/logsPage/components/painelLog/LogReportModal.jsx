// src/features/logsPage/components/LogReportModal.jsx
import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { PopupModal } from '../../../../components/shared/PopupModal';

export const LogReportModal = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  return (
    <PopupModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Resumo do Relatório" 
      icon={FileText}
    >
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 size={48} className="text-green-600 mb-4 animate-bounce" />
        
        <span className="text-[10px] font-bold text-black uppercase mb-1">
          Status: {data.status}
        </span>
        
        {/* CONTAINER DO SCROLL: Ajustado com max-h e custom-scrollbar */}
        <div className="w-full max-h-[300px] bg-white/50 rounded-xl border border-zinc-200 mb-6 text-left overflow-y-auto custom-scrollbar">
          <p className="text-[12px] text-zinc-800 font-medium p-4 leading-relaxed whitespace-pre-wrap">
            {data.resumo}
          </p>
        </div>

        <p className='text-[10px] text-black mb-4 font-mono'>
          Gerado em: {data.data_geracao}
        </p>

        <button 
          disabled 
          className="w-full py-3 bg-zinc-400 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
        >
          Download PDF (Em breve)
        </button>
      </div>
    </PopupModal>
  );
};

export default LogReportModal;