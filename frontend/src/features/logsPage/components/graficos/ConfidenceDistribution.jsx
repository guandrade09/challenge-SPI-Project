// src/features/logsPage/components/graficos/ConfidenceDistribution.jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const ConfidenceDistribution = ({ data = [] }) => {
  // A lógica de cores: 
  // Baixa Confiança (Incerteza) -> Vermelho/Laranja
  // Alta Confiança (Estabilidade) -> Verde/Tom de Madeira do Grower
  const getBarColor = (range) => {
    const value = parseInt(range.split('-')[0]);
    if (value < 60) return '#ef4444'; // Crítico (Muita incerteza)
    if (value < 80) return '#f59e0b'; // Alerta (Confiança média)
    return '#B59481'; // Estável (Padrão Grower-IA)
  };

  return (
    <div className="flex flex-col h-full w-full p-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          
          <XAxis 
            dataKey="range" 
            tick={{ fill: '#71717a', fontSize: 9, fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            tick={{ fill: '#71717a', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '11px'
            }}
          />

          <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.range)} 
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="text-[8px] text-black font-bold text-center mt-2 uppercase tracking-widest">
        Distribuição de Assertividade (Real-time)
      </div>
    </div>
  );
};

export default ConfidenceDistribution;