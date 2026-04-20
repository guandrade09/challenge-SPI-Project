// src/features/logsPage/components/graficos/InferenceLatencyChart.jsx
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { BasePanel } from '../../../../components/shared/BasePanel';

export const InferenceLatencyChart = ({ title, data }) => {
  return (
    <BasePanel title={title || "LATÊNCIA DE INFERÊNCIA (ms)"} isGraf={true} allowFullScreen={true}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="hora" 
            hide // Escondemos os segundos para não poluir, mas o dado está lá
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10 }}
            unit="ms"
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />

          {/* Linha de Referência: O "Ideal" para tempo real é abaixo de 50ms */}
          <ReferenceLine y={50} label={{ position: 'right', value: 'Limite RT', fill: '#ef4444', fontSize: 9 }} stroke="#ef4444" strokeDasharray="3 3" />

          <Area 
            type="step" // Usamos step para parecer um monitor de sinal digital
            dataKey="latencia" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorLat)" 
            name="Latência"
          />
        </AreaChart>
      </ResponsiveContainer>
    </BasePanel>
  );
};

export default InferenceLatencyChart;