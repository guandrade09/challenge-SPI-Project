import React, { useState } from 'react';
import { FileText, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { PopupModal } from '../../../../components/shared/PopupModal';
import { reportService } from '../../../../services/reportService';
import { useToast } from '../../../../components/ui/NotificationToast';

export const LogReportModal = ({ isOpen, onClose, data }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { mostrarToast } = useToast();

  if (!isOpen || !data) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await reportService.downloadPdf();
    } catch (error) {
      onClose();
      mostrarToast("Erro ao baixar PDF!", 'vermelho', 3);
    } finally {
      setIsDownloading(false);
    }
  };

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

        <div className="w-full max-h-[300px] bg-white/50 rounded-xl border border-zinc-200 mb-6 text-left overflow-y-auto custom-scrollbar">
          <p className="text-[12px] text-zinc-800 font-medium p-4 leading-relaxed whitespace-pre-wrap">
            {data.resumo}
          </p>
        </div>

        <p className="text-[10px] text-black mb-4 font-mono">
          Gerado em: {data.data_geracao}
        </p>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`btn-download ${isDownloading ? 'btn-download--loading' : 'btn-download--ready'}`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Baixando...
            </>
          ) : (
            <>
              <Download size={16} />
              Download PDF
            </>
          )}
        </button>
      </div>
    </PopupModal>
  );
};

export default LogReportModal;