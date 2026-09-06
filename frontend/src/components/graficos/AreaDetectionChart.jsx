import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AreaDetectionChart = ({ data, theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorAlertas-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-alertas)" stopOpacity={theme === 'dynamic' ? 0.4 : 0.8} />
              <stop offset="95%" stopColor="var(--chart-alertas)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`colorProc-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-proc)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-proc)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)', 
              borderColor: 'var(--chart-tooltip-border)', 
              color: 'var(--chart-text)',
              borderRadius: '12px',
              fontSize: '11px'
            }} 
          />

          <Area
            type="monotone"
            dataKey="processamento"
            stroke="var(--chart-proc)"
            fillOpacity={1}
            fill={`url(#colorProc-${theme})`}
          />
          <Area
            type="monotone"
            dataKey="alertas"
            stroke="var(--chart-alertas)"
            strokeWidth={theme === 'dynamic' ? 2 : 3}
            fillOpacity={1}
            fill={`url(#colorAlertas-${theme})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaDetectionChart;