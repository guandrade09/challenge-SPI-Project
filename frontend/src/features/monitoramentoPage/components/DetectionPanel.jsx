import React from 'react';
import { DetectionCard } from './DetectionCard';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

export const DetectionPanel = ({ options }) => {
  // Pegamos o estado e a função de disparar o toggle da nossa Store (Zustand)
  const { detections, toggleDetection } = useMonitoramentoStore();

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {options.map((option) => (
        <DetectionCard
          key={option.id}
          label={option.label}
          isChecked={!!detections[option.id]} // Força booleano (default false)
          onToggle={() => toggleDetection(option.id)}
        />
      ))}
    </div>
  );
};

export default DetectionPanel;