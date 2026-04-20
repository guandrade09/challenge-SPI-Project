// src/features/logsPage/components/LogSettingsButton.jsx
import React from 'react';
import { Settings2 } from 'lucide-react';

export const LogSettingsButton = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="p-1.5 hover:bg-black/10 rounded-lg text-zinc-800 transition-colors"
      title="Configurações de Log"
    >
      <Settings2 size={18} />
    </button>
  );
};