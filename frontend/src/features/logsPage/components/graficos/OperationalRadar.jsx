// src/features/logsPage/components/OperationalRadar.jsx
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { BasePanel } from '../../../../components/shared/BasePanel';

export const OperationalRadar = ({ title, data }) => {
  return (
    <BasePanel title={title || "EFICIÊNCIA OPERACIONAL"} isGraf={true} allowFullScreen={true}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#000000" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#000000', fontSize: 10, fontWeight: 'bold' }} />
          <Radar
            name="Sistema"
            dataKey="A"
            stroke="#B59481"
            fill="#B59481"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </BasePanel>
  );
};

export default OperationalRadar;