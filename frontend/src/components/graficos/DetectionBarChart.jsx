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

export const DetectionBarChart = ({ title, data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
        {BARS.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name}
            fill={bar.fill}
            radius={[4, 4, 0, 0]}
            barSize={50}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DetectionBarChart;