import React from 'react';
import { Settings2 } from 'lucide-react';
import { IconButton } from '../../../../components/shared/IconButton';

export const LogSettingsButton = ({ onClick }) => {
  return (
    <IconButton 
      icon={Settings2} 
      onClick={onClick} 
      variant="ghost" 
      title="Filtros do Painel de Log"
    />
  );
};

export default LogSettingsButton;