import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DetectionLineChart = ({ data, theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="hora"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 10 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 10 }}
            dx={-5}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-text)',
              borderRadius: '15px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
              fontSize: '12px' 
            }}
          />
          <Line
            type="monotone"
            dataKey="alertas"
            stroke={theme === 'dynamic' ? 'var(--chart-normal-node)' : '#d84d4d'}
            strokeWidth={4}
            dot={{ fill: 'var(--chart-alertas)', r: 4, strokeWidth: 2, stroke: 'var(--p-bg)' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DetectionLineChart;