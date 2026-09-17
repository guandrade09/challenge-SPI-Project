import { useState, useEffect, useCallback } from "react";
import { reportPerformanceService } from "../services/reportPerfomance";

export const useResourceMetrics = (threadTarget = null, limit = 30) => {
  const [data, setData] = useState([]);
  const [threadsFound, setThreadsFound] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await reportPerformanceService.listMetrics();
      const rawData = response?.data?.data || response?.data || response || [];

      if (!Array.isArray(rawData)) {
        setData([]);
        return;
      }

      // Se passou threadTarget, filtra por ela; caso contrário traz todas
      const filteredData = threadTarget
        ? rawData.filter((item) => item.thread_name === threadTarget)
        : rawData;

      const groupedMap = new Map();
      const detectedThreads = new Set();

      filteredData.forEach((item) => {
        if (!item.timestamp) return;

        const dateObj = new Date(item.timestamp);
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");

        const groupKey = `${dateObj.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
        const timeStr = `${hours}:${minutes}`;
        const thread = item.thread_name || "geral";

        detectedThreads.add(thread);

        const cpuUsage = Number(item.quantity_of_cpu_ind_percentage) || 0;
        const processLoaded = Number(item.process_loaded) || 0;

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            timestamp: dateObj.getTime(),
            time: timeStr,
            fullDate: `${day}/${month} às ${hours}:${minutes}`,
            threadName: threadTarget ? thread : "Aplicação / Geral",
            cpuSum: cpuUsage,
            paginasMax: processLoaded,
            count: 1,
            // Mantém suporte dinâmico também
            [`cpu_${thread}`]: cpuUsage,
            [`paginas_${thread}`]: processLoaded,
          });
        } else {
          const existing = groupedMap.get(groupKey);
          existing.cpuSum += cpuUsage;
          existing.paginasMax = Math.max(existing.paginasMax, processLoaded);
          existing.count += 1;
          existing[`cpu_${thread}`] = cpuUsage;
          existing[`paginas_${thread}`] = processLoaded;
        }
      });

      const formattedData = Array.from(groupedMap.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((item) => ({
          ...item,
          cpu: parseFloat((item.cpuSum / item.count).toFixed(2)),
          paginas: item.paginasMax,
        }))
        .slice(-limit);

      setData(formattedData);
      setThreadsFound(Array.from(detectedThreads));
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar métricas de performance:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [threadTarget, limit]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, threadsFound, isLoading, error, refetch: fetchMetrics };
};

export default useResourceMetrics;