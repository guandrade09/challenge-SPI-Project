import React from 'react';
import { Bot } from 'lucide-react';
import { useUiStore } from '../../../store/useUiStore';
import { IconButton } from '../../shared/IconButton'; // Importe o mestre

export const AiToggleButton = () => {
  const toggleAiSidebar = useUiStore((state) => state.toggleAiSidebar);

  return (
    <IconButton 
      icon={Bot} 
      label="Falar com Assistente IA" 
      onClick={toggleAiSidebar} 
      variant="full" 
    />
  );
};

export default AiToggleButton;