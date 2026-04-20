// src/features/logsPage/components/LogReportModal.jsx
import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { PopupModal } from '../../../../components/shared/PopupModal';

export const LogReportModal = ({ isOpen, onClose, data }) => {
  return (
    <PopupModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Resumo do Relatório" 
      icon={FileText}
    >
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 size={48} className="text-green-600 mb-4 animate-bounce" />
        
        <span className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
          Status: {data.status}
        </span>
        
        <p className="text-zinc-700 text-sm leading-relaxed mb-6">
          {data.resumo}
        </p>

        <div className="w-full p-4 bg-white/50 rounded-xl border border-zinc-200 mb-6 text-left">
          <p className="text-[10px] text-zinc-500 uppercase font-mono">
            Gerado em: {data.data_geracao}
          </p>
        </div>

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