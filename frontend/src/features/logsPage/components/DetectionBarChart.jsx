// src/features/logsPage/components/DetectionBarChart.jsx
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Capacete', detectado: 45, naoDetectado: 12 },
  { name: 'Colete', detectado: 38, naoDetectado: 19 },
  { name: 'Óculos', detectado: 52, naoDetectado: 5 },
];

export const DetectionBarChart = ({ title }) => {
  return (
    <div className="w-full max-w-md bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col mt-8">
      {/* Cabeçalho seguindo o padrão visual das imagens anteriores */}
      <div className="bg-[#B59481] py-3 text-center">
        <span className="text-zinc-800 font-bold text-xs uppercase tracking-widest">
          {title || "FREQUÊNCIA DE DETECÇÕES"}
        </span>
      </div>

      <div className="p-6 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#3f3f46', fontSize: 12, fontWeight: 'bold' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#3f3f46', fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            
            {/* Coluna 1: Detectado */}
            <Bar 
              dataKey="detectado" 
              name="Detectado" 
              fill="#22c55e" // Verde
              radius={[4, 4, 0, 0]} 
              barSize={25}
            />
            
            {/* Coluna 2: Não Detectado */}
            <Bar 
              dataKey="naoDetectado" 
              name="Não Detectado" 
              fill="#ef4444" // Vermelho
              radius={[4, 4, 0, 0]} 
              barSize={25}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DetectionBarChart;