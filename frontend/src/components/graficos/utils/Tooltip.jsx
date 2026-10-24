export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;

    const formatTimestamp = (item) => {
      if (item?.fullDate) return item.fullDate;
      
      const rawDate = item?.timestamp || item?.date || item?.created_at;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `${date} às ${time}`;
        }
      }

      const time = item?.hora || item?.time || "";
      const date = item?.data || item?.day || "";
      
      if (date && time) return `${date} às ${time}`;
      if (time) return `Horário: ${time}`;
      return item?.range ? `Confiança: ${item.range}` : (label ?? "");
    };

    return (
      <div className="p-3 bg-gray-900 border border-gray-700 text-white rounded-xl shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold border-b border-gray-700 pb-1 text-emerald-400">
          {formatTimestamp(dataItem)}
        </p>

        {payload.map((entry, index) => {
          const isPercentage = ["cpu", "precisao"].includes(entry.dataKey);
          return (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : entry.value}${isPercentage ? "%" : ""}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};