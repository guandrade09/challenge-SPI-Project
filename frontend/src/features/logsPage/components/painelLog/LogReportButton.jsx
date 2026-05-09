import React from 'react';
import { FileDownIcon } from 'lucide-react';
import { useUiStore } from '../../../../store/useUiStore';
import { IconButton } from '../../../../components/shared/IconButtonModal';
import { reportService } from '../../../../services/reportService';
import { useToast } from '../../../../components/ui/NotificationToast';

export const LogReportButton = () => {
  const openPopUpModal = useUiStore((state) => state.openPopUpModal);
  const { mostrarToast } = useToast();

  const handleGenerateReport = async () => {
    try {
      // 1. Chama o backend para gerar o resumo
      const summary = await reportService.getSummary();
      // 2. Abre o modal passando os dados reais
      openPopUpModal(summary);
    } catch (error) {
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