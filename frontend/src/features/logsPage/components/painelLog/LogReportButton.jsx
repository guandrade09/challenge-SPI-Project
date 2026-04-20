import React from 'react';
import { FileDownIcon } from 'lucide-react';
import { useUiStore } from '../../../../store/useUiStore';
import { IconButton } from '../../../../components/shared/IconButton';

export const LogReportButton = () => {
  // Corrigido para o nome padrão do seu store
  const togglePopUpModal = useUiStore((state) => state.togglePopUpModal);

  return (
    <IconButton 
      icon={FileDownIcon} 
      label="Gerar Relatório" 
      onClick={togglePopUpModal} 
      variant="full" 
    />
  );
};

export default LogReportButton;