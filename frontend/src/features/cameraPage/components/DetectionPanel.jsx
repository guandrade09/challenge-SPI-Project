import React, { useState } from 'react';
import { Shield, Settings } from 'lucide-react';
import { DetectionCard } from './DetectionCard';
import { CameraManagementPanel } from './CameraManagementPanel';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

export const DetectionPanel = ({ 
  options, 
  theme,
  cameras,
  currentIndex,
  currentCamera,
  onSelectCamera,
  isEditingRiskArea, 
  setIsEditingRiskArea, 
  hasRiskArea,
  onClearRiskArea,
  onToggleEpi,
  onAddCamera,
  onDeleteCamera,
  onEditCamera
}) => {
  const { detections } = useMonitoramentoStore();
  const [activeTab, setActiveTab] = useState('epis');

  return (
    <div className="flex flex-col gap-3 w-full h-full justify-between">
      
      {/* ABAS DE NAVEGAÇÃO */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--p-header-bg)] border border-theme-divider">
        <button
          type="button"
          onClick={() => setActiveTab('epis')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all font-theme-title cursor-pointer ${
            activeTab === 'epis'
              ? 'bg-[var(--p-button-bg)] text-theme-accent border border-[var(--p-subtext)] shadow-sm'
              : 'text-theme-muted hover:text-theme-title hover:bg-[var(--p-toggle-hover)]'
          }`}
        >
          <Shield size={14} />
          <span>EPIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all font-theme-title cursor-pointer ${
            activeTab === 'config'
              ? 'bg-[var(--p-button-bg)] text-theme-accent border border-[var(--p-subtext)] shadow-sm'
              : 'text-theme-muted hover:text-theme-title hover:bg-[var(--p-toggle-hover)]'
          }`}
        >
          <Settings size={14} />
          <span>Gestão</span>
        </button>
      </div>

      {/* ABA 1: DETECÇÃO DE EPIS */}
      {activeTab === 'epis' && (
        <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto custom-scrollbar pr-1">
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
          onEditCamera={onEditCamera}
        />
      )}
    </div>
  );
};

export default DetectionPanel;