import React from 'react';
import { DetectionCard } from './DetectionCard';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

export const DetectionPanel = ({ options }) => {
  const { detections, toggleDetection } = useMonitoramentoStore();

  return (
    <div className="flex flex-col gap-2 w-full">
      {options.map((option) => (
        <DetectionCard
          key={option.id}
          label={option.label}
          isChecked={!!detections[option.id]}
          onToggle={() => toggleDetection(option.id)}
        />
      ))}
    </div>
  );
};

export default DetectionPanel;