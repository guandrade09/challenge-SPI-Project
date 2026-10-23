import React, { useState } from 'react';
import { FileText, CheckCircle2, FileDown, Table, Loader2 } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../../components/shared';
import { reportService } from '../../../../services/reportService';
import { useToast } from '../../../../components/ui/NotificationToast';

export const LogReportModal = ({ isOpen, onClose, data, theme = "dynamic" }) => {
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
      actions={[]} 
      maxWidth="max-w-md"
      theme={theme}
    >
      <div className="flex flex-col items-center text-center">
        {/* Ícone agora usa a cor de destaque do tema */}
        <CheckCircle2 size={48} className="text-emerald-500 mb-4 animate-bounce" />

        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-main-theme mb-2">
          Status: {data.status}
        </span>

        {/* Caixa de texto integrada ao container interno do tema */}
        <div 
          className="w-full max-h-[300px] rounded-xl border border-theme-divider mb-6 text-left overflow-y-auto custom-scrollbar"
          style={{ backgroundColor: 'var(--p-bg)' }}
        >
          <p className="text-[12px] text-main-theme font-mono p-4 leading-relaxed whitespace-pre-wrap">
            {data.resumo}
          </p>
        </div>

        <p className="text-[10px] text-muted-theme mb-6 font-mono uppercase tracking-wide">
          Gerado em: {data.data_geracao}
        </p>

        {/* Botões usando o padrão unificado limpo */}
        <div className="flex gap-4 w-full justify-center">
          <IconButtonModal
            icon={isDownloading ? Loader2 : FileDown}
            label={isDownloading ? "Aguarde..." : "Baixar PDF"}
            onClick={() => handleDownload('pdf')}
            className={`w-full ${isDownloading ? "opacity-50 pointer-events-none" : ""}`}
            variant="full"
          />
          
          <IconButtonModal
            icon={isDownloading ? Loader2 : Table}
            label={isDownloading ? "Aguarde..." : "Baixar Excel"}
            onClick={() => handleDownload('excel')}
            className={`w-full ${isDownloading ? "opacity-50 pointer-events-none" : ""}`}
            variant="full"
          />
        </div>
      </div>
    </PopupModal>
  );
};

export default LogReportModal;