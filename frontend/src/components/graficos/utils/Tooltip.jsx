export const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;

    const formatTimestamp = (item) => {
      if (item?.fullDate) return item.fullDate;
      
      const rawDate = item?.timestamp || item?.date || item?.created_at;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        }
      }

      const time = item?.hora || item?.time || "";
      const date = item?.data || item?.day || "";
      
      if (date && time) return `${date} às ${time}`;
      if (time) return `Horário: ${time}`;
      return "Data/Hora N/A";
    };

    return (
      <div className="p-3 bg-gray-900 border border-gray-700 text-white rounded-xl shadow-xl text-xs space-y-1 z-50">
        <p className="font-bold border-b border-gray-700 pb-1 text-emerald-400">
          {formatTimestamp(dataItem)}
        </p>

        {dataItem?.threadName && (
          <p className="text-gray-400 italic text-[10px]">
            {`Thread: ${dataItem.threadName}`}
          </p>
        )}

        {payload.map((entry, index) => {
          const isPercentage = ["cpu", "precisao"].includes(entry.dataKey);
          return (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
              {`${entry.name}: ${entry.value}${isPercentage ? "%" : ""}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};