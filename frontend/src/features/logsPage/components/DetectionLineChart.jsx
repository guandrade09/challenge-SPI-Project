// src/features/logsPage/components/DetectionLineChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BasePanel } from '../../../components/shared/BasePanel';

export const DetectionLineChart = ({ title, data }) => {
  return (
    <BasePanel title={title || "GRAFICO DE LINHAS"} isGraf={true}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" />
          
          <XAxis 
            dataKey="hora" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#000000', fontSize: 10 }} 
            dy={10} // Empurra as labels das horas um pouco para baixo
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#000000', fontSize: 10 }}
            dx={-5} // Afasta os números do eixo Y da grade
          />
          
          <Tooltip 
            contentStyle={{ 
              borderRadius: '15px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: '12px'
            }}
          />
          
          <Line 
            type="monotone" 
            dataKey="alertas" 
            stroke="#d84d4d" 
            strokeWidth={4}
            dot={{ fill: '#aa3bff', r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BasePanel>
  );
};

export default DetectionLineChart;