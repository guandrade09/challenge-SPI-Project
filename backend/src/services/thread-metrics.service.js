import cluster from "cluster";
import os from "os";
import { formatBrasiliaTimestamp } from "../api/utils/convert.js";

class ThreadMetricsService {
  constructor() {
    this.threadMetrics = [];
    this.metricCollectionIntervalId = null;
    this.batchSendIntervalId = null;
    this.lastCpuUsage = null;
    this.lastCpuCheckTime = null;
  }

  startWorker() {
    this.initializeCpuMonitor();
    this.collectAndSendWorkerThreadMetric();

    this.metricCollectionIntervalId = setInterval(async () => {
      await this.collectAndSendWorkerThreadMetric();
    }, 100000);

  }

  startAggregator() {
    this.batchSendIntervalId = setInterval(async () => {
      await this.sendThreadMetricsBatch();
    }, 300000);

  }

  stop() {
    if (this.metricCollectionIntervalId) {
      clearInterval(this.metricCollectionIntervalId);
    }
    if (this.batchSendIntervalId) {
      clearInterval(this.batchSendIntervalId);
    }
  }

  initializeCpuMonitor() {
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuCheckTime = process.hrtime.bigint();
  }

  getCurrentCpuLoad() {
    const now = process.hrtime.bigint();
    const nowUsage = process.cpuUsage();
    const elapsedMicros = Number((now - this.lastCpuCheckTime) / 1000n);
    const cpuMicros = (nowUsage.user - this.lastCpuUsage.user) + (nowUsage.system - this.lastCpuUsage.system);

    this.lastCpuUsage = nowUsage;
    this.lastCpuCheckTime = now;

    if (elapsedMicros <= 0) {
      return 0;
    }

    const cpuPercent = (cpuMicros / elapsedMicros) * 100 / os.cpus().length;
    return Math.round(cpuPercent * 100) / 100;
  }

  getBackendThreadCount() {
    return os.cpus().length;
  }

  collectThreadMetric() {
    return {
      timestamp: formatBrasiliaTimestamp(),
      thread_name: "backend_processor",
      quantity_of_cpu_ind_percentage: this.getCurrentCpuLoad(),
      process_loaded: this.getBackendThreadCount(),
      worker_pid: process.pid,
    };
  }

  async collectAndSendWorkerThreadMetric() {
    if (!process.send) {
      return;
    }

    const metric = this.collectThreadMetric();

    process.send({
      type: "THREAD_METRIC",
      payload: metric,
    });
  }

  addWorkerMetric(metric) {
    this.threadMetrics.push(metric);

    if (this.threadMetrics.length > 1000) {
      this.threadMetrics.shift();
    }
  }

  async sendThreadMetricsBatch() {
    if (this.threadMetrics.length === 0) {
      console.log("[THREAD METRICS] Nenhuma métrica para enviar no batch de 5 minutos.");
      return;
    }

    const totalProcessLoaded = this.threadMetrics.reduce(
      (sum, metric) => sum + (Number(metric.process_loaded) || 0),
      0
    );

    const avgCpuLoad =
      this.threadMetrics.reduce(
        (sum, metric) => sum + (Number(metric.quantity_of_cpu_ind_percentage) || 0),
        0
      ) / this.threadMetrics.length;

    const latestTimestamp = this.threadMetrics[this.threadMetrics.length - 1]?.timestamp || formatBrasiliaTimestamp();

    const payload = {
      thread_name: "backend_processor",
      timestamp: latestTimestamp,
      quantity_of_cpu_ind_percentage: Math.round(avgCpuLoad * 100) / 100,
      process_loaded: totalProcessLoaded,
    };

    const url = "http://localhost:3000/api/threads";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Status ${response.status}: ${text}`);
      }

      this.threadMetrics = [];
    } catch (error) {
      console.error("[THREAD METRICS] Falha ao enviar batch de métricas:", error.message);
    }
  }
}

const threadMetricsService = new ThreadMetricsService();
export default threadMetricsService;
export { threadMetricsService };
