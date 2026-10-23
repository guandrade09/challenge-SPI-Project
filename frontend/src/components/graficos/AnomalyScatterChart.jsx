import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const AnomalyScatterChart = ({ data = [], theme = "dynamic" }) => {
  return (
    <div className={`panel-theme-${theme} w-full h-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--chart-grid)" opacity={0.6} />
          <XAxis 
            dataKey="categoria" 
            type="category" 
            name="Categoria" 
            tick={{ fill: 'var(--chart-text)', fontSize: 9, fontWeight: 'bold' }} 
            axisLine={{ stroke: 'var(--chart-axis)' }} 
            tickLine={false} 
          />
          <YAxis 
            dataKey="confianca" 
            type="number" 
            name="Confiança" 
            unit="%" 
            domain={[0, 100]} 
            tick={{ fill: 'var(--chart-text)', fontSize: 9 }} 
            axisLine={{ stroke: 'var(--chart-axis)' }} 
            tickLine={false} 
          />
          <ZAxis dataKey="importancia" range={[100, 500]} />
          
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--chart-text)' }} 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-text)',
              borderRadius: '12px', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)', 
              fontSize: '11px' 
            }} 
          />
          
          <Scatter name="Detecções" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.confianca < 60 ? '#ef4444' : 'var(--chart-normal-node)'} 
                className="transition-all duration-300 hover:opacity-80" 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnomalyScatterChart;