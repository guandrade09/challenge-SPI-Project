import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const GRADIENT_IDS = {
  alertas: { id: 'colorAlertas', color: '#B59481' },
  proc:     { id: 'colorProc',    color: '#71717a' },
};

export const AreaDetectionChart = ({ title, data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={GRADIENT_IDS.alertas.id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={GRADIENT_IDS.alertas.color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={GRADIENT_IDS.alertas.color} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={GRADIENT_IDS.proc.id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={GRADIENT_IDS.proc.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={GRADIENT_IDS.proc.color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
        <Tooltip />

        <Area
          type="monotone"
          dataKey="processamento"
          stroke={GRADIENT_IDS.proc.color}
          fillOpacity={1}
          fill={`url(#${GRADIENT_IDS.proc.id})`}
        />
        <Area
          type="monotone"
          dataKey="alertas"
          stroke={GRADIENT_IDS.alertas.color}
          strokeWidth={3}
          fillOpacity={1}
          fill={`url(#${GRADIENT_IDS.alertas.id})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaDetectionChart;