// src/components/graficos/ResourceMonitor.jsx
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;

    return (
      <div className="p-3 bg-gray-900 border border-gray-700 text-white rounded-xl shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold border-b border-gray-700 pb-1 text-emerald-400">
          {dataItem?.fullDate || `Horário: ${dataItem?.time}`}
        </p>

        {dataItem?.threadName && (
          <p className="text-gray-400 italic text-[10px]">
            {`Thread: ${dataItem.threadName}`}
          </p>
        )}

        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
            {`${entry.name}: ${entry.value}${entry.dataKey === "cpu" ? "%" : ""}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Configuração padrão apontando para as variáveis CSS dinâmicas do Design System
const defaultConfig = [
  { 
    key: "cpu", 
    name: "Consumo CPU / Heap (%)", 
    stroke: "var(--chart-line-1)", 
    yAxisId: "left" 
  },
  { 
    key: "paginas", 
    name: "Carga de Processos / Páginas", 
    stroke: "var(--chart-line-2)", 
    yAxisId: "right" 
  },
];

export const ResourceMonitor = ({
  data = [],
  theme = "dynamic",
  linesConfig = defaultConfig,
  showRightAxis = true,
  yAxisLeftDomain = [0, 100],
  title = "",
}) => {
  return (
    <div className={`panel-theme-${theme} flex flex-col h-full w-full p-1`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--chart-grid)" />

          <XAxis
            dataKey="time"
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