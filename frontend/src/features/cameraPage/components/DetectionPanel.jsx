// src/components/DetectionPanel.jsx
import React, { useState } from 'react';
import { Shield, Settings } from 'lucide-react';
import { DetectionCard } from './DetectionCard';
import { CameraManagementPanel } from './CameraManagementPanel';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

export const DetectionPanel = ({ 
  options, 
  theme,
  cameras,
  currentIndex, // Prop recebida aqui
  currentCamera,
  onSelectCamera,
  isEditingRiskArea, 
  setIsEditingRiskArea, 
  hasRiskArea,
  onClearRiskArea,
  onToggleEpi,
  onAddCamera,
  onDeleteCamera
}) => {
  const { detections } = useMonitoramentoStore();
  const [activeTab, setActiveTab] = useState('epis');

  return (
    <div className="flex flex-col gap-3 w-full h-full justify-between">
      
      {/* ABAS DE NAVEGAÇÃO */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-900/40 border border-theme-divider">
        <button
          type="button"
          onClick={() => setActiveTab('epis')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'epis'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield size={14} />
          <span>EPIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'config'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Settings size={14} />
          <span>Gestão</span>
        </button>
      </div>

      {/* ABA 1: DETECÇÃO DE EPIS */}
      {activeTab === 'epis' && (
        <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto">
          {options.map((option) => (
            <DetectionCard
              key={option.id}
              label={option.label}
              isChecked={!!detections[option.id]}
              onToggle={() => onToggleEpi(option.id)}
            />
          ))}
        </div>
      )}

      {/* ABA 2: GERENCIAMENTO E PAINEL DE RISCO */}
      {activeTab === 'config' && (
        <CameraManagementPanel 
          theme={theme}
          cameras={cameras}
          currentIndex={currentIndex}
          currentCamera={currentCamera}
          onSelectCamera={onSelectCamera}
          isEditingRiskArea={isEditingRiskArea}
          setIsEditingRiskArea={setIsEditingRiskArea}
          hasRiskArea={hasRiskArea}
          onClearRiskArea={onClearRiskArea}
          onAddCamera={onAddCamera}
          onDeleteCamera={onDeleteCamera}
        />
      )}
    </div>
  );
};

export default DetectionPanel;