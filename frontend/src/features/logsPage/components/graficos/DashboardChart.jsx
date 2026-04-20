// src/features/logsPage/components/DashboardChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BasePanel } from '../../../../components/shared/BasePanel';

export const DashboardChart = ({ title, data = [] }) => {
  return (
    <BasePanel title={title || "GRAFICO DE PIZZA"} isGraf={true} allowFullScreen={true}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </BasePanel>
  );
};

export default DashboardChart;