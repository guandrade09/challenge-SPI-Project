import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export const InferenceLatencyChart = ({ data, theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorLat-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--chart-proc)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-proc)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="hora" hide />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 10 }}
            unit="ms"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-text)',
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }} 
          />
          <ReferenceLine
            y={50}
            label={{ position: 'right', value: 'Limite RT', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }}
            stroke="#ef4444"
            strokeDasharray="3 3"
          />
          <Area
            type="step"
            dataKey="latencia"
            stroke="var(--chart-proc)"
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#colorLat-${theme})`}
            name="Latência"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InferenceLatencyChart;