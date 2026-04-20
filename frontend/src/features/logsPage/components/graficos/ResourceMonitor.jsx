// src/features/logsPage/components/graficos/ResourceMonitor.jsx
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';

export const ResourceMonitor = ({ data = [] }) => {
  return (
    <div className="flex flex-col h-full w-full p-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          {/* Grade técnica quadrilhada */}
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e5e5e5" />
          
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#71717a', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            domain={[30, 90]} 
            tick={{ fill: '#71717a', fontSize: 9 }}
            unit="°C"
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip 
            contentStyle={{ 
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
            wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '10px' }}
          />

          {/* Linha de Alerta de Temperatura (80°C é crítico para ESP32) */}
          <ReferenceLine 
            y={80} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            label={{ value: 'CRÍTICO', position: 'right', fill: '#ef4444', fontSize: 8, fontWeight: 'bold' }} 
          />

          {/* Core 0 - Geralmente lida com Wi-Fi/MQTT/Stack TCP */}
          <Line 
            type="monotone" 
            dataKey="core0" 
            name="CPU Core 0"
            stroke="#B59481" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4 }}
          />

          {/* Core 1 - Onde seu modelo de ML (Inference) deve estar rodando */}
          <Line 
            type="monotone" 
            dataKey="core1" 
            name="CPU Core 1 (ML)"
            stroke="#6366f1" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4 }}
          />

                    <Line 
            type="monotone" 
            dataKey="core2" 
            name="CPU Core 2 (OpenCV)"
            stroke="#f83d3d" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="text-[8px] text-zinc-400 font-bold text-center mt-2 uppercase tracking-widest">
        Temperatura de Operação (SoC ESP32-P4)
      </div>
    </div>
  );
};

export default ResourceMonitor;