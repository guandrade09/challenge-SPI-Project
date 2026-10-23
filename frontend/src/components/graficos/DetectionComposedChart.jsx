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

export const DetectionComposedChart = ({ data, theme = "light" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
          
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
          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px', color: 'var(--chart-text)' }} />
          
          <Bar yAxisId="left" dataKey="processamento" name="Carga de Processamento" barSize={20} fill="var(--chart-proc)" radius={[4, 4, 0, 0]} />
          <Line yAxisId="left" type="monotone" dataKey="alertas" name="Alertas Detectados" stroke="var(--chart-alertas)" strokeWidth={3} dot={{ r: 4, fill: 'var(--chart-alertas)' }} />
          <Line yAxisId="right" type="monotone" dataKey="precisao" name="Precisão IA (%)" stroke={theme === 'dynamic' ? 'var(--chart-text)' : '#22c55e'} strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DetectionComposedChart;