// src/features/logsPage/components/DetectionLineChart.jsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { hora: '08:00', alertas: 5 },
  { hora: '10:00', alertas: 12 },
  { hora: '12:00', alertas: 8 },
  { hora: '14:00', alertas: 25 },
  { hora: '16:00', alertas: 18 },
  { hora: '18:00', alertas: 10 },
];

export const DetectionLineChart = ({ title }) => {
  return (
    <div className="w-full max-w-md bg-[#D9D9D9] rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
      <div className="bg-[#B59481] py-3 text-center">
        <span className="text-zinc-800 font-bold text-xs uppercase tracking-widest">
          {title || "TENDÊNCIA DE ALERTAS (HOJE)"}
        </span>
      </div>

      <div className="p-6 h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
            <XAxis 
              dataKey="hora" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#3f3f46', fontSize: 10 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#3f3f46', fontSize: 10 }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="alertas" 
              stroke="#d84d4d" 
              strokeWidth={3}
              dot={{ fill: '#aa3bff', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DetectionLineChart;