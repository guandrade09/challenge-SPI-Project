import React, { useState } from 'react';
import { useElementSize } from '../../../hooks/useElementSize';
import { containerToFramePercent, frameBoxToContainerRect, getCoverTransform, getContainTransform } from '../../../utils/coverTransform';
import { RISK_AREA_SLOTS } from '../../../utils/riskAreas';

export function RiskAreasOverlay({ areas = [], frameWidth, frameHeight, editable = false, selectedId, onDraw, fit = 'cover' }) {
  const [element, setElement] = useState(null);
  const [start, setStart] = useState(null);
  const [preview, setPreview] = useState(null);
  const size = useElementSize(element);
  const transform = (fit === 'contain' ? getContainTransform : getCoverTransform)(size.width, size.height, frameWidth, frameHeight);
  const position = (event) => {
    const rect = element.getBoundingClientRect();
    return containerToFramePercent(transform, event.clientX - rect.left, event.clientY - rect.top);
  };
  const boxBetween = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) });
  const handleClick = (event) => {
    if (!editable || !transform) return;
    const point = position(event);
    if (!start) { setStart(point); setPreview(null); }
    else {
      const box = boxBetween(start, point);
      if (box.width > 0.5 && box.height > 0.5) onDraw(box);
      setStart(null); setPreview(null);
    }
  };
  const visible = preview ? [...areas.filter((a) => a.id !== selectedId),
    { id: selectedId, nome: areas.find((a) => a.id === selectedId)?.nome || `Área ${selectedId}`, box: preview }] : areas;
  return <div ref={setElement} data-testid="risk-areas-overlay" className={`absolute inset-0 z-20 overflow-hidden ${editable ? 'cursor-crosshair' : 'pointer-events-none'}`}
    onClick={handleClick} onMouseMove={(event) => {
      if (editable && start && transform) setPreview(boxBetween(start, position(event)));
    }}>
    {transform && visible.map((area) => {
      const rect = frameBoxToContainerRect(transform, area.box);
      const color = RISK_AREA_SLOTS.find((slot) => slot.id === area.id)?.color || '#f59e0b';
      return <div key={area.id} data-area-id={area.id} className="absolute border-2 pointer-events-none"
        style={{ ...rect, borderColor: color, backgroundColor: `${color}22`, borderStyle: editable && area.id === selectedId ? 'dashed' : 'solid' }}>
        <span title={area.nome} className="absolute left-0 top-0 max-w-[240px] truncate rounded-br-md px-2 py-1 text-xs font-bold text-slate-950"
          style={{ backgroundColor: color }}>{area.id}. {area.nome}</span>
      </div>;
    })}
    {editable && <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-3 py-2 text-xs text-white pointer-events-none">
      {start ? 'Clique no canto final' : 'Clique no canto inicial da área'}
    </span>}
  </div>;
}
