// src/features/logsPage/components/AreaDetectionChart.jsx
import React from 'react';
// 1. REMOVA defs, linearGradient e stop do import
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { BasePanel } from '../../../../components/shared/BasePanel';

export const AreaDetectionChart = ({ title, data }) => {
  return (
    <BasePanel title={title || "GRAFICO DE COMPARAÇÃO"} isGraf={true} allowFullScreen={true}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Gradiente para Alertas (Marrom/Bronze) */}
            <linearGradient id="colorAlertas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B59481" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#B59481" stopOpacity={0}/>
            </linearGradient>

            {/* Gradiente para Processamento (Cinza/Azulado para contraste) */}
            <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
          <Tooltip />

          {/* Camada 1: Processamento (Fica atrás por ser geralmente maior) */}
          <Area 
            type="monotone" 
            dataKey="processamento" 
            stroke="#71717a" 
            fillOpacity={1} 
            fill="url(#colorProc)" 
          />

          {/* Camada 2: Alertas (Fica na frente, mais visível) */}
          <Area 
            type="monotone" 
            dataKey="alertas" 
            stroke="#B59481" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorAlertas)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </BasePanel>
  );
};

export default AreaDetectionChart;