import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export const OperationalRadar = ({ data, theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--chart-text)', fontSize: 10, fontWeight: 'bold' }} 
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid var(--chart-tooltip-border)',
              backgroundColor: 'var(--chart-tooltip-bg)',
              color: 'var(--chart-text)',
              fontSize: '11px',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: 'var(--chart-text)' }}
          />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="var(--chart-radar-stroke)"
            strokeWidth={3}
            fill="var(--chart-radar-fill)"
            fillOpacity={theme === 'dynamic' ? 0.3 : 0.6}
            dot={{ r: 4, fill: 'var(--chart-radar-stroke)', stroke: 'var(--p-bg)', strokeWidth: 1 }}
            activeDot={{ r: 6, stroke: 'var(--chart-text)', strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OperationalRadar;