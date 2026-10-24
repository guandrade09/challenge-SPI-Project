import React from 'react';
import { EyeOff, ScanLine } from 'lucide-react';
import { getFrameOverlayData } from '../utils/frameOverlayData';

export function OverlayVisibilityControls({ details, source, hasLateralFrame, showEpi, showReba, showZone = true, onToggleEpi, onToggleReba, onToggleZone }) {
  const { epi, reba, zona } = getFrameOverlayData(details, source, { hasLateralFrame });
  const controls = [
    { label: 'EPI', available: epi.length > 0, visible: showEpi, onClick: onToggleEpi },
    { label: 'REBA', available: reba.length > 0, visible: showReba, onClick: onToggleReba },
    { label: 'Zona de Risco', available: zona.length > 0, visible: showZone, onClick: onToggleZone },
  ];

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {controls.map(({ label, available, visible, onClick }) => (
        <button key={label} type="button" onClick={onClick} disabled={!available || !onClick} aria-pressed={available && visible}
          title={available ? `${visible ? 'Ocultar' : 'Mostrar'} ${label}` : `${label}: sem coordenadas salvas para esta câmera`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme-divider text-xs text-theme-main hover:bg-theme-hover disabled:opacity-40 disabled:cursor-not-allowed">
          {available && visible ? <EyeOff size={16} /> : <ScanLine size={16} />}
          {available && visible ? 'Ocultar' : 'Mostrar'} {label}
        </button>
      ))}
    </div>
  );
}
