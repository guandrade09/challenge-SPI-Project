// src/features/logsPage/components/DashboardChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Acerto', value: 400, color: '#00ff00' },
  { name: 'Erro', value: 300, color: '#ff0000' },
  { name: 'Acerto com erro', value: 300, color: '#0000ff' },
];

export const DashboardChart = ({ title }) => {
  return (
    <div className="w-full max-w-md bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="bg-[#B59481] py-3 text-center shrink-0">
        <span className="text-zinc-800 font-bold text-xs uppercase tracking-widest">
          {title || "TITULO DO GRAFICO DE PIZZA"}
        </span>
      </div>

      {/* Área do Gráfico */}
      <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
        </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 ${color} border border-black/20`}></div>
    <span className="text-[10px] font-bold text-zinc-700 uppercase">{label}</span>
  </div>
);

export default DashboardChart;