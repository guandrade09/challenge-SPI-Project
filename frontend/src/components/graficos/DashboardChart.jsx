import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const DashboardChart = ({ data = [], theme = "dynamic" }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getPieColor = (originalColor) => {
    if (theme === 'dynamic') return 'var(--chart-normal-node)'; 
    return originalColor;
  };

  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
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
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getPieColor(entry.color)}
                  stroke="var(--p-bg)" // Reutiliza o background do painel como borda separadora nativa!
                  strokeWidth={2}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.25}
                  style={{ transition: 'all 0.3s ease' }}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Badges de legenda */}
      <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
        {data.map((entry, index) => (
          <div
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full border border-transparent transition-all duration-300 cursor-default ${
              hoveredIndex === index ? 'scale-105 shadow-md panel-btn-toggle' : 'bg-transparent'
            }`}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPieColor(entry.color) }} />
            <span className="text-[9px] font-bold uppercase panel-text-title">{entry.name}</span>
            {hoveredIndex === index && (
              <span className="text-[9px] font-mono font-black panel-text-sub animate-in fade-in slide-in-from-left-1 duration-300">
                {entry.value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="text-[8px] font-bold text-center mt-3 uppercase tracking-widest opacity-60 panel-text-title">
        Prevalência de Objetos Detectados
      </div>
    </div>
  );
};

export default DashboardChart;