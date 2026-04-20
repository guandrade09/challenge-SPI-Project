import React from 'react';
import { FileDownIcon } from 'lucide-react';
import { useUiStore } from '../../../../store/useUiStore';
import { IconButton } from '../../../../components/shared/IconButton';

export const LogReportButton = () => {
  const toggleReportPopup = useUiStore((state) => state.toggleReportModal);

  return (
    <IconButton 
      icon={FileDownIcon} 
      label="Gerar Relatorio" 
      onClick={toggleReportPopup} 
      variant="full" 
    />
  );
};

export default LogReportButton;