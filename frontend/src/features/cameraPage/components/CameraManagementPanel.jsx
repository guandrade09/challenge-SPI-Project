import React from 'react';
import { Target, Check, Trash2, Camera, Video, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ButtonAddCam } from './ButtonAddCam';
import { ButtonDeleteCam } from './ButtonDeleteCam';
import { ButtonEditCam } from './ButtonEditCam';
import { useCameraPresetsStore } from '../../../store/useCameraPresetsStore';

const EPI_LABELS = {
  colete: 'Colete',
  oculos: 'Óculos',
  capacete: 'Capacete',
  mascara: 'Máscara',
  luvas: 'Luvas',
};

export const CameraManagementPanel = ({
  theme,
  cameras = [],
  currentIndex = 0,
  currentCamera,
  onSelectCamera,
  isEditingRiskArea,
  setIsEditingRiskArea,
  hasRiskArea,
  onClearRiskArea,
  onAddCamera,
  onDeleteCamera,
  onEditCamera
}) => {
  const presets = useCameraPresetsStore((state) => state.presets);
  const getRiskAreaForCamera = useCameraPresetsStore((state) => state.getRiskAreaForCamera);

  const handleSelect = (cam) => {
    if (onSelectCamera) {
      setIsEditingRiskArea(false);
      onSelectCamera(cam);
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between min-h-0 overflow-hidden font-theme-body">
      
      {/* SEÇÃO 1: LISTA E GERENCIAMENTO DE CÂMERAS */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex items-center justify-between px-0.5 shrink-0">
          <span className="text-theme-head flex items-center gap-1.5">
            <Camera size={12} className="text-theme-muted" /> Câmeras ({cameras.length})
          </span>

          <div className="flex items-center gap-1">
            <ButtonAddCam
              theme={theme}
              onAddCamera={onAddCamera}
              label=""
              colorVariant="success"
              className="p-1.5"
            />
            {currentCamera && (
              <ButtonEditCam
                camera={currentCamera}
                theme={theme}
                onEditCamera={onEditCamera}
              />
            )}
            {currentCamera && (
              <ButtonDeleteCam
                camera={currentCamera}
                theme={theme}
                onDeleteCamera={onDeleteCamera}
              />
            )}
          </div>
        </div>

        {/* LISTA DE CÂMERAS */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto p-1.5 rounded-xl panel-subcard custom-scrollbar">
          {cameras.length === 0 ? (
            <div className="p-4 text-center text-xs text-theme-muted font-mono">
              Nenhuma câmera cadastrada.
            </div>
          ) : (
            cameras.map((cam, idx) => {
              const isActive = currentCamera && cam.id 
                ? cam.id === currentCamera.id 
                : idx === currentIndex;

              // Resgata EPIs da store ou da própria câmera
              const camPreset = presets[cam.id];
              const rawEpis = Array.isArray(camPreset)
                ? camPreset
                : camPreset?.selectedEpis || cam.epis || [];

              const activeEpiNames = rawEpis
                .map((epiKey) => EPI_LABELS[epiKey] || epiKey)
                .join(', ');

              // Checa se a câmera possui área de risco configurada
              const camRiskArea = getRiskAreaForCamera 
                ? getRiskAreaForCamera(cam.id) 
                : (camPreset?.riskArea || cam.riskArea);
              
              const camHasRiskArea = Boolean(
                camRiskArea && 
                (Array.isArray(camRiskArea) ? camRiskArea.length > 0 : Object.keys(camRiskArea).length > 0)
              );

              return (
                <button
                  key={cam.id || `cam-${idx}`}
                  type="button"
                  onClick={() => handleSelect(cam)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all text-xs font-mono cursor-pointer select-none shrink-0 border ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-sm'
                      : 'bg-transparent border-transparent text-theme-muted hover:bg-theme-divider/50 hover:text-theme-main'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0 flex-1 mr-2">
                    <Video size={14} className={isActive ? 'text-amber-400 shrink-0' : 'text-theme-muted shrink-0'} />
                    
                    <div className="flex flex-col truncate min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate leading-tight text-theme-main">{cam.nome || `Câmera ${idx + 1}`}</span>
                        
                        {/* Indicador de Zona Configurada */}
                        {camHasRiskArea ? (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                            <Target size={9} /> ZONA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] bg-theme-divider/40 text-theme-muted border border-theme-divider font-normal shrink-0">
                            SEM ZONA
                          </span>
                        )}
                      </div>
                      
                      {/* Exibição dos EPIs Dinâmicos */}
                      <span className="text-[9px] text-theme-muted font-normal leading-tight truncate mt-0.5 opacity-75">
                        {cam.setor ? `${cam.setor} • ` : ''}
                        EPIs: {rawEpis.length > 0 ? activeEpiNames : 'Nenhum'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0 ml-1" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* SEÇÃO 2: CONTROLE DE ÁREA DE RISCO DA CÂMERA SELECIONADA */}
      <div className="pt-3 mt-2 border-t border-theme-divider flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-theme-head flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-theme-muted" /> Zona de Alerta
          </span>
          <span className={`text-[10px] font-mono ${hasRiskArea ? 'text-emerald-400 font-bold' : 'text-theme-muted'}`}>
            {hasRiskArea ? '☑ CONFIGURADA' : '☐ SEM ZONA'}
          </span>
        </div>

        {!isEditingRiskArea ? (
          <button
            type="button"
            onClick={() => setIsEditingRiskArea(true)}
            disabled={!currentCamera}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Target size={15} className="text-amber-400" />
            <span>{hasRiskArea ? 'Editar Área' : 'Delimitar Área'}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsEditingRiskArea(false)}
              className="icon-btn-success text-xs font-semibold uppercase tracking-wider gap-1.5"
            >
              <Check size={14} />
              <span>Concluir</span>
            </button>

            <button
              type="button"
              onClick={onClearRiskArea}
              className="icon-btn-danger text-xs font-semibold uppercase tracking-wider gap-1.5"
            >
              <Trash2 size={14} />
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default CameraManagementPanel;