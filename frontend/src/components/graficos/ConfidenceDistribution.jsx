import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const ConfidenceDistribution = ({ data = [], theme = "dynamic" }) => {
  const getBarColor = (range) => {
    const value = parseInt(range.split('-')[0]);
    if (value < 60) return '#ef4444'; 
    if (value < 80) return '#f59e0b';
    return 'var(--chart-normal-node)'; // Utiliza a variável injetada pelo wrapper do tema
  };

  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="range" tick={{ fill: 'var(--chart-text)', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 9 }} axisLine={false} tickLine={false} />
          
          <Tooltip 
            cursor={{ fill: 'transparent' }} 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              border: 'none',
              borderRadius: '12px', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', 
              fontSize: '11px' 
            }} 
          />
          
          <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} className="transition-all duration-300 hover:opacity-80" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="text-[8px] font-bold text-center mt-2 uppercase tracking-widest panel-text-sub">
        Distribuição de Assertividade (Real-time)
      </div>
    </div>
  );
};

export default ConfidenceDistribution;