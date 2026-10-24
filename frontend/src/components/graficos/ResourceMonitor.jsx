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
import { defaultConfigResourceMonitor } from "./utils/Config";
import { formatXAxisTick, getResolvedKey } from "./utils/Formatters";

export const ResourceMonitor = ({
  data = [],
  theme = "dynamic",
  linesConfig = defaultConfigResourceMonitor,
  showRightAxis = true,
  yAxisLeftDomain = [0, 100],
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
            yAxisId="left"
            domain={yAxisLeftDomain}
            tick={{ fill: "var(--chart-text)", fontSize: 9 }}
            unit="%"
            axisLine={false}
            tickLine={false}
          />

          {showRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, "auto"]}
              tick={{ fill: "var(--chart-text)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
          )}

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

          {linesConfig.map((line) => (
            <Line
              key={line.key}
              yAxisId={line.yAxisId || "left"}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.stroke}
              strokeWidth={2}
              dot={{ stroke: line.stroke, fill: line.stroke, r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
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

export default ResourceMonitor;