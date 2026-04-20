// src/features/logsPage/components/graficos/AnomalyScatterChart.jsx
import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { BasePanel } from '../../../../components/shared/BasePanel';

export const AnomalyScatterChart = ({ title, data }) => {
  return (
    <BasePanel title={title || "DETECÇÕES E ANOMALIAS"} isGraf={true} allowFullScreen={true}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="categoria" 
            type="category" 
            name="Categoria" 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
            axisLine={false}
          />
          
          <YAxis 
            dataKey="confianca" 
            type="number" 
            name="Confiança" 
            unit="%" 
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
          />
          
          {/* O tamanho do ponto (Z) pode representar a 'importância' do alerta */}
          <ZAxis dataKey="importancia" range={[50, 400]} />
          
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: '12px', border: 'none' }}
          />

          <Scatter name="Detecções" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                // Se a confiança for baixa, o ponto fica vermelho (Alerta)
                fill={entry.confianca < 60 ? '#ef4444' : '#B59481'} 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </BasePanel>
  );
};

export default AnomalyScatterChart;