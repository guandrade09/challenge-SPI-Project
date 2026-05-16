import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

export const ResourceMonitor = ({ data = [], theme = "dynamic" }) => {
  // Ajusta dinamicamente os traços baseado no tema ativo
  const getCoreStroke = (key, defaultColor) => {
    if (theme === 'dynamic') {
      if (key === 'core1') return 'var(--chart-core-ml)';
      if (key === 'core2') return 'var(--chart-text)';
      return 'var(--chart-normal-node)'; // Core 0 (branco puro)
    }
    return defaultColor;
  };

  const CORES = [
    { key: 'core0', name: 'CPU Core 0',         stroke: '#B59481' },
    { key: 'core1', name: 'CPU Core 1 (ML)',     stroke: 'var(--chart-core-ml)' },
    { key: 'core2', name: 'CPU Core 2 (OpenCV)', stroke: '#f83d3d' },
  ];

  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--chart-grid)" />
          <XAxis dataKey="time" tick={{ fill: 'var(--chart-text)', fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis domain={[30, 90]} tick={{ fill: 'var(--chart-text)', fontSize: 9 }} unit="°C" axisLine={false} tickLine={false} />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-text)',
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
              fontSize: '11px' 
            }} 
          />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle" 
            wrapperStyle={{ 
              fontSize: '9px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              paddingBottom: '10px',
              color: 'var(--chart-text)'
            }} 
          />
          
          <ReferenceLine 
            y={80} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            label={{ value: 'CRÍTICO', position: 'right', fill: '#ef4444', fontSize: 8, fontWeight: 'bold' }} 
          />
          
          {CORES.map((c) => (
            <Line 
              key={c.key} 
              type="monotone" 
              dataKey={c.key} 
              name={c.name} 
              stroke={getCoreStroke(c.key, c.stroke)} 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 4 }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="text-[8px] font-bold text-center mt-2 uppercase tracking-widest panel-text-sub">
        Temperatura de Operação (SoC ESP32-P4)
      </div>
    </div>
  );
};

export default ResourceMonitor;