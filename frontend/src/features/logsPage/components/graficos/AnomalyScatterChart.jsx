// src/features/logsPage/components/graficos/AnomalyScatterChart.jsx
import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const AnomalyScatterChart = ({ data }) => {
  return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
          {/* AJUSTE: vertical={true} e cor mais visível para criar o quadrilhado */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={true} 
            stroke="#000000" 
            opacity={0.5}
          />
          
          <XAxis 
            dataKey="categoria" 
            type="category" 
            name="Categoria" 
            tick={{ fill: '#000000', fontSize: 9, fontWeight: 'bold' }}
            axisLine={{ stroke: '#000000' }}
            tickLine={false}
          />
          
          <YAxis 
            dataKey="confianca" 
            type="number" 
            name="Confiança" 
            unit="%" 
            domain={[0, 100]}
            tick={{ fill: '#000000', fontSize: 9 }}
            axisLine={{ stroke: '#000000' }}
            tickLine={false}
          />
          
          <ZAxis dataKey="importancia" range={[100, 500]} />
          
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: '#000000' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #9c9c9c',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '11px'
            }}
          />

          <Scatter name="Detecções" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.confianca < 60 ? '#ef4444' : '#B59481'}
                className="transition-all duration-300 hover:opacity-80" 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
  );
};

export default AnomalyScatterChart;