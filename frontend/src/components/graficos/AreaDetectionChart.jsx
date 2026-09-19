import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CustomTooltip } from "./utils/Tooltip";
import { formatXAxisTick, getResolvedKey } from "./utils/Formatters";

export const AreaDetectionChart = ({
  data = [],
  theme = "dynamic",
  title = "",
  xDataKey,
}) => {
  const resolvedKey = getResolvedKey(data, xDataKey);

  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorAlertas-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-alertas)" stopOpacity={theme === "dynamic" ? 0.4 : 0.8} />
              <stop offset="95%" stopColor="var(--chart-alertas)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`colorProc-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-proc)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-proc)" stopOpacity={0} />
            </linearGradient>
          </defs>

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

          <Area
            type="monotone"
            dataKey="processamento"
            name="Carga de Processamento"
            stroke="var(--chart-proc)"
            fillOpacity={1}
            fill={`url(#colorProc-${theme})`}
          />
          <Area
            type="monotone"
            dataKey="alertas"
            name="Alertas Detectados"
            stroke="var(--chart-alertas)"
            strokeWidth={theme === "dynamic" ? 2 : 3}
            fillOpacity={1}
            fill={`url(#colorAlertas-${theme})`}
          />
        </AreaChart>
      </ResponsiveContainer>

      {title && (
        <div className="text-[8px] font-bold text-center mt-2 uppercase tracking-widest panel-text-sub">
          {title}
        </div>
      )}
    </div>
  );
};

export default AreaDetectionChart;