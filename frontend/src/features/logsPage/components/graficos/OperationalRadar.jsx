// src/features/logsPage/components/OperationalRadar.jsx
import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, ResponsiveContainer, Tooltip 
} from 'recharts';

export const OperationalRadar = ({ title, data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#000000" />
        
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: '#000000', fontSize: 10, fontWeight: 'bold' }} 
        />

        {/* TOOLTIP ADICIONADO: Responsável por mostrar o valor no hover */}
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: '1px solid #000', 
            backgroundColor: '#fff',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}
          itemStyle={{ color: '#000' }}
        />

        <Radar
          name="Performance"
          dataKey="A"
          stroke="#c4fcbc"
          strokeWidth={3}
          fill="#65ffd1"
          fillOpacity={0.6}
          // dot={true} faz com que as bolinhas nos vértices fiquem visíveis e interativas
          dot={{ r: 4, fill: '#9cfa8f', stroke: '#000', strokeWidth: 1 }}
          activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default OperationalRadar;