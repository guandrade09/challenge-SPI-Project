import React from 'react';
import { Settings2 } from 'lucide-react';
import { IconButtonModal } from '../../../../components/shared/IconButtonModal';

export const LogSettingsButton = ({ onClick, theme = "dynamic" }) => {
  return (
    <IconButtonModal 
      icon={Settings2} 
      onClick={onClick} 
      variant="ghost" 
      title="Filtros do Painel de Log"
      className="panel-btn-toggle"
    />
  );
};

export default LogSettingsButton;