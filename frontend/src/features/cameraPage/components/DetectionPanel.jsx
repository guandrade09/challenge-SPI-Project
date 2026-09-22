import React from 'react';
import { Shield, Settings } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow'; // 1. IMPORTAR USE SHALLOW
import { DetectionCard } from './DetectionCard';
import { CameraManagementPanel } from './CameraManagementPanel';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';

// Array constante para fallback estático
const EMPTY_ARRAY = [];

export const DetectionPanel = ({
  options = [],
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
  updatingEpiId,
  epiConfigError,
  onAddCamera,
  onDeleteCamera,
  onEditCamera,
  activeTab,
  setActiveTab,
}) => {

  // ✅ CORREÇÃO COM useShallow E FALLBACK ESTÁTICO:
  const activeEpis = useCameraPresetsStore(
    useShallow((state) => {
      if (!currentCamera?.id) return EMPTY_ARRAY;
      const data = state.presets[currentCamera.id];
      if (Array.isArray(data)) return data;
      return data?.selectedEpis || currentCamera.epis || EMPTY_ARRAY;
    })
  );

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
          {epiConfigError && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              {epiConfigError}
            </p>
          )}
          {options.map((option) => {
            const isChecked = activeEpis.includes(option.id);

            return (
              <DetectionCard
                key={option.id}
                label={option.label}
                isChecked={isChecked}
                onToggle={() => onToggleEpi(currentCamera?.id, option.id)}
                isUpdating={updatingEpiId === option.id}
                disabled={Boolean(updatingEpiId)}
              />
            );
          })}
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
