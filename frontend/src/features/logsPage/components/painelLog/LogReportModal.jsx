// src/features/logsPage/components/LogReportModal.jsx
import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

export const LogReportModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-panel-bg rounded-panel shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-panel-header p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-zinc-800" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-800">Resumo do Relatório</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          <CheckCircle2 size={48} className="text-green-600 mb-4 animate-bounce" />
          
          <span className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Status: {data.status}</span>
          <p className="text-zinc-700 text-sm leading-relaxed mb-6">
            {data.resumo}
          </p>

          <div className="w-full p-4 bg-white/50 rounded-xl border border-zinc-200 mb-6 text-left">
            <p className="text-[10px] text-zinc-500 uppercase font-mono">Gerado em: {data.data_geracao}</p>
          </div>

          <button 
            disabled 
            className="w-full py-3 bg-zinc-400 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
          >
            Download PDF (Em breve)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogReportModal;