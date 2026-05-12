import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const DetectionComposedChart = ({ title, data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#f5f5f5" vertical={false} />
        <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
        <Bar yAxisId="left" dataKey="processamento" name="Carga de Processamento" barSize={20} fill="#93c5fd" radius={[4, 4, 0, 0]} />
        <Line yAxisId="left" type="monotone" dataKey="alertas" name="Alertas Detectados" stroke="#B59481" strokeWidth={3} dot={{ r: 4, fill: '#B59481' }} />
        <Line yAxisId="right" type="monotone" dataKey="precisao" name="Precisão IA (%)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DetectionComposedChart;