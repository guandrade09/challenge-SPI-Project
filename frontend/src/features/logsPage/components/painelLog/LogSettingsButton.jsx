import React from 'react';
import { Settings2 } from 'lucide-react';
import { IconButtonModal } from '../../../../components/shared/IconButtonModal';

export const LogSettingsButton = ({ onClick }) => {
  return (
    <IconButtonModal 
      icon={Settings2} 
      onClick={onClick} 
      variant="ghost" 
      title="Filtros do Painel de Log"
    />
  );
};

export default LogSettingsButton;