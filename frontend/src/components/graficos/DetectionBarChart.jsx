import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const BARS = [
  { key: 'detectado',    name: 'Detectado',    fill: '#22c55e' },
  { key: 'naoDetectado', name: 'Não Detectado', fill: '#ef4444' },
];

export const DetectionBarChart = ({ data, theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 12, fontWeight: 'bold' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--p-toggle-hover)', opacity: 0.2 }}
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-text)',
              borderRadius: '15px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
            }}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ color: 'var(--chart-text)' }} />
          {BARS.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              // Modo de alta performance adota cores da marca ou monocromáticas se necessário, ou mantém semáforo
              fill={theme === 'dynamic' && bar.key === 'detectado' ? 'var(--chart-normal-node)' : bar.fill}
              radius={[4, 4, 0, 0]}
              barSize={50}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DetectionBarChart;