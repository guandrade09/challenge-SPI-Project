import {
  Bar, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CustomTooltip } from './utils/Tooltip';
import { formatXAxisTick } from './utils/Formatters';

export function EpiAbsenceChart({ data = [], selectedEpi, epiLabel }) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-xs panel-text-sub">
        Nenhuma detecção de EPI ausente registrada no período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxisTick}
          tick={{ fill: 'var(--chart-text)', fontSize: 9 }}
          minTickGap={25}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, 'auto']}
          tick={{ fill: 'var(--chart-text)', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: 10, paddingBottom: 8 }} />
        <Line
          dataKey="totalAbsent"
          name="Total de EPIs ausentes"
          type="linear"
          stroke="var(--chart-line-2)"
          strokeWidth={2}
          strokeOpacity={0.7}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        <Bar
          dataKey={selectedEpi}
          name={`${epiLabel} ausente`}
          fill="var(--chart-alertas)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default EpiAbsenceChart;
