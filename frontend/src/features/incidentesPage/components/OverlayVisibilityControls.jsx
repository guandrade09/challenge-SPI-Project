import React from 'react';
import { EyeOff, ScanLine } from 'lucide-react';
import { getFrameOverlayData } from '../utils/frameOverlayData';

export function OverlayVisibilityControls({ details, source, hasLateralFrame, showEpi, showReba, onToggleEpi, onToggleReba }) {
  const { epi, reba } = getFrameOverlayData(details, source, { hasLateralFrame });
  const controls = [
    { label: 'EPI', available: epi.length > 0, visible: showEpi, onClick: onToggleEpi },
    { label: 'REBA', available: reba.length > 0, visible: showReba, onClick: onToggleReba },
  ].filter((control) => control.available);
  if (!controls.length) return null;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {controls.map(({ label, visible, onClick }) => (
        <button key={label} type="button" onClick={onClick} aria-pressed={visible} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-theme-divider text-xs text-theme-main hover:bg-theme-hover">
          {visible ? <EyeOff size={16} /> : <ScanLine size={16} />}
          {visible ? 'Ocultar' : 'Mostrar'} {label}
        </button>
      ))}
    </div>
  );
}
