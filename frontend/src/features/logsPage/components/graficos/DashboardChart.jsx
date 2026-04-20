// src/features/logsPage/components/DashboardChart.jsx
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const DashboardChart = ({ data = [] }) => {
  // Estado para controlar qual item está com o mouse em cima
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="flex flex-col h-full w-full p-1">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={5}
              dataKey="value"
              // Adiciona animação suave ao gráfico quando a legenda é tocada
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke="none"
                  // Destaca a fatia se a legenda estiver em hover
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.3}
                  style={{ transition: 'all 0.3s ease' }}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda Customizada com Animação */}
      <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
        {data.map((entry, index) => (
          <div
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`
              flex items-center gap-2 px-2 py-1 rounded-full border border-black/10
              transition-all duration-300 cursor-default
              ${hoveredIndex === index ? 'scale-110 bg-zinc-100 shadow-md border-black/30' : 'scale-100 bg-transparent'}
            `}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }} 
            />
            
            <span className="text-[9px] font-bold uppercase text-zinc-500">
              {entry.name}
            </span>

            {/* Mostra o valor apenas se estiver em hover com animação de fade-in */}
            {hoveredIndex === index && (
              <span className="text-[9px] font-mono font-black text-zinc-800 animate-in fade-in slide-in-from-left-1 duration-300">
                {entry.value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="text-[8px] text-black font-bold text-center mt-3 uppercase tracking-widest opacity-60">
        Prevalência de Objetos Detectados
      </div>
    </div>
  );
};

export default DashboardChart;