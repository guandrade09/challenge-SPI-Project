import React from 'react';
import { FileDownIcon } from 'lucide-react';
import { useUiStore } from '../../../../store/useUiStore';
import { IconButton } from '../../../../components/shared/IconButtonModal';
import { reportService } from '../../../../services/reportService';
import { useToast } from '../../../../components/ui/NotificationToast';

export const LogReportButton = () => {
  const openPopUpModal = useUiStore((s) => s.openPopUpModal);
  const { mostrarToast } = useToast();

  const handleGenerateReport = async () => {
    try {
      const summary = await reportService.getSummary();
      openPopUpModal(summary);
    } catch {
      mostrarToast("Erro ao gerar relatório!", 'vermelho', 3);
    }
  };

  return (
    <IconButton
      icon={FileDownIcon}
      label="Gerar Relatório"
      onClick={handleGenerateReport}
      variant="full"
    />
  );
};

export default LogReportButton;