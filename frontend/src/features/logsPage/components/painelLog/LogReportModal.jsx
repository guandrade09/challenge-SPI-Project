import React, { useState } from 'react';
import { FileText, CheckCircle2, FileDown, Table, Loader2 } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../../components/shared';
import { reportService } from '../../../../services/reportService';
import { useToast } from '../../../../components/ui/NotificationToast';

export const LogReportModal = ({ isOpen, onClose, data }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { mostrarToast } = useToast();

  if (!isOpen || !data) return null;

  const handleDownload = async (type) => {
    setIsDownloading(true);
    try {
      if (type === 'pdf') await reportService.downloadPdf();
      else await reportService.downloadExcel();
    } catch (error) {
      mostrarToast(`Erro ao baixar ${type.toUpperCase()}!`, 'vermelho', 3);
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
      // Deixamos o actions vazio para limpar o header
      actions={[]} 
      maxWidth="max-w-md"
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

        <p className="text-[10px] text-black mb-6 font-mono">
          Gerado em: {data.data_geracao}
        </p>

        {/* Container dos botões de download utilizando o seu IconButtonModal */}
        <div className="flex gap-4 w-full justify-center">
          <IconButtonModal
            icon={isDownloading ? Loader2 : FileDown}
            label={isDownloading ? "Aguarde..." : "Baixar PDF"}
            onClick={() => handleDownload('pdf')}
            className={isDownloading ? "opacity-50 pointer-events-none" : "bg-white w-full max-w-auto hover:bg-red-200"}
            variant="full"
          />
          
          <IconButtonModal
            icon={isDownloading ? Loader2 : Table}
            label={isDownloading ? "Aguarde..." : "Baixar Excel"}
            onClick={() => handleDownload('excel')}
            className={isDownloading ? "opacity-50 pointer-events-none" : "bg-white w-full max-w-auto hover:bg-green-300"}
            variant="full"
          />
        </div>
      </div>
    </PopupModal>
  );
};

export default LogReportModal;