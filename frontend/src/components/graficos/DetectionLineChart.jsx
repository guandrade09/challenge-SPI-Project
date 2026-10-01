import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CustomTooltip } from "./utils/Tooltip";
import { formatXAxisTick, getResolvedKey } from "./utils/Formatters";

export const DetectionLineChart = ({
  data = [],
  theme = "dynamic",
  title = "",
  xDataKey,
}) => {
  const resolvedKey = getResolvedKey(data, xDataKey);

  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--chart-grid)" />

          <XAxis
            dataKey={resolvedKey}
            tickFormatter={formatXAxisTick}
            tick={{ fill: "var(--chart-text)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "var(--chart-text)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{
              fontSize: "9px",
              fontWeight: "bold",
              textTransform: "uppercase",
              paddingBottom: "10px",
              color: "var(--chart-text)",
            }}
          />

          <Line
            type="monotone"
            dataKey="alertas"
            name="Alertas Detectados"
            stroke={theme === "dynamic" ? "var(--chart-normal-node)" : "var(--chart-alertas)"}
            strokeWidth={2}
            dot={{ stroke: "var(--chart-alertas)", fill: "var(--chart-alertas)", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {title && (
        <div className="text-[8px] font-bold text-center mt-2 uppercase tracking-widest panel-text-sub">
          {title}
        </div>
      )}
    </div>
  );
};

export default DetectionLineChart;