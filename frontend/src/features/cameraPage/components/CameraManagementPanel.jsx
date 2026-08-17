import React from 'react';
import { Target, Check, Trash2, Camera, Video, CheckCircle2 } from 'lucide-react';
import { ButtonAddCam } from './ButtonAddCam';
import { ButtonDeleteCam } from './ButtonDeleteCam';

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
  onDeleteCamera
}) => {
  const handleSelect = (cam) => {
    if (onSelectCamera) {
      setIsEditingRiskArea(false);
      onSelectCamera(cam);
    }
  };

  return (
    // Removido overflow-y-auto do container pai para permitir expansao perfeita
    <div className="flex flex-col h-full w-full justify-between min-h-0 overflow-hidden">
      
      {/* SEÇÃO 1: LISTA E GERENCIAMENTO DE CÂMERAS (EXPANSÍVEL) */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {/* Cabeçalho da seção com ações compactas */}
        <div className="flex items-center justify-between px-0.5 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Camera size={12} /> Câmeras ({cameras.length})
          </span>

          <div className="flex items-center gap-1">
            <ButtonAddCam 
              theme={theme} 
              onAddCamera={onAddCamera} 
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
              label="Adicionar"
              colorVariant="success"
            />
            {currentCamera && (
              <ButtonDeleteCam 
                camera={currentCamera} 
                theme={theme} 
                onDeleteCamera={onDeleteCamera} 
              />
            )}
          </div>
        </div>

        {/* LISTA DE CÂMERAS COM SCROLL RESPONSIVO */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto p-1 rounded-xl bg-neutral-950/50 border border-theme-divider scrollbar-thin">
          {cameras.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500 font-mono">
              Nenhuma câmera cadastrada.
            </div>
          ) : (
            cameras.map((cam, idx) => {
              const isActive = currentCamera && cam.id 
                ? cam.id === currentCamera.id 
                : idx === currentIndex;

              return (
                <button
                  key={cam.id || `cam-${idx}`}
                  type="button"
                  onClick={() => handleSelect(cam)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all text-xs font-mono cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow-sm'
                      : 'bg-neutral-900/40 border border-transparent text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Video size={14} className={isActive ? 'text-amber-400' : 'text-neutral-500'} />
                    <div className="flex flex-col truncate">
                      <span className="truncate leading-tight">{cam.nome || `Câmera ${idx + 1}`}</span>
                      {cam.setor && (
                        <span className="text-[9px] text-neutral-500 font-normal leading-tight">
                          {cam.setor}
                        </span>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* SEÇÃO 2: CONTROLE DE ÁREA DE RISCO (FIXADO AO RODAPÉ DO PAINEL) */}
      <div className="pt-3 mt-2 border-t border-theme-divider flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Target size={12} /> Zona de Alerta
          </span>
          <span className={`text-[10px] font-mono ${hasRiskArea ? 'text-emerald-400' : 'text-neutral-500'}`}>
            {hasRiskArea ? '• Configurada' : '• Sem zona'}
          </span>
        </div>

        {!isEditingRiskArea ? (
          <button
            type="button"
            onClick={() => setIsEditingRiskArea(true)}
            disabled={!currentCamera}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Target size={15} className="text-amber-400" />
            <span>{hasRiskArea ? 'Editar Área' : 'Delimitar Área'}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsEditingRiskArea(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <Check size={14} />
              <span>Concluir</span>
            </button>

            <button
              type="button"
              onClick={onClearRiskArea}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95"
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