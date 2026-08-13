// src/components/graficos/ResourceMonitor.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

// 🚀 OTIMIZAÇÃO: Recebe linesConfig, showRightAxis e os domínios dinamicamente da HomePage
export const ResourceMonitor = ({ 
  data = [], 
  theme = "dynamic",
  linesConfig = [],
  showRightAxis = false,
  yAxisLeftDomain = [0, 'auto']
}) => {

  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--chart-grid)" />
          
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'var(--chart-text)', fontSize: 9 }} 
            axisLine={false} 
            tickLine={false} 
          />
          
          {/* Eixo Y Esquerdo Principal (Uso Heap JS %) */}
          <YAxis 
            yAxisId="left"
            domain={yAxisLeftDomain} 
            tick={{ fill: 'var(--chart-text)', fontSize: 9 }} 
            unit="%" 
            axisLine={false} 
            tickLine={false} 
          />
          
          {/* 🚀 NOVO: Eixo Y Direito Secundário (Páginas Carregadas) */}
          {showRightAxis && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']} 
              tick={{ fill: 'var(--chart-text)', fontSize: 9 }} 
              axisLine={false} 
              tickLine={false}
              allowDecimals={false}
            />
          )}
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-text)',
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
              fontSize: '11px' 
            }} 
          />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle" 
            wrapperStyle={{ 
              fontSize: '9px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase', 
              paddingBottom: '10px',
              color: 'var(--chart-text)'
            }} 
          />
          
          {/* Linha de Alerta de Sobrecarga do Sistema */}
          <ReferenceLine 
            yAxisId="left"
            y={80} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            label={{ value: 'ALERTA', position: 'right', fill: '#ef4444', fontSize: 8, fontWeight: 'bold' }} 
          />
          
          {/* 🚀 RENDERIZAÇÃO DINÂMICA: Mapeia as configurações passadas pela HomePage */}
          {linesConfig.map((line) => (
            <Line 
              key={line.key} 
              yAxisId={line.yAxisId || 'left'}
              type="monotone" 
              dataKey={line.key} 
              name={line.name} 
              stroke={line.stroke} 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 4 }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="text-[8px] font-bold text-center mt-2 uppercase tracking-widest panel-text-sub">
        Telemetria e Desempenho da Aplicação Client-Side
      </div>
    </div>
  );
};

export default ResourceMonitor;