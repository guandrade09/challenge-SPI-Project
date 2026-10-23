import cluster from "cluster";
import os from "os";
import app from "./app.js";
import { initDatabase } from "./config/database.js";
import realtimeService from "../services/realtime-service.js";
import threadMetricsService from "../services/thread-metrics.service.js";
import logMonitorService from "../services/log-monitor.service.js";

const numCPUs = os.cpus().length;
const PORT = 3000;

async function startWorker() {
  try {
    app.listen(PORT, () => {
      console.log(`Worker ${process.pid} rodando na porta ${PORT}`);
      threadMetricsService.startWorker();
    });
  } catch (err) {
    console.error(`Erro ao iniciar worker ${process.pid}:`, err);
    process.exit(1);
  }
}

if (cluster.isPrimary) {
  async function startPrimary() {
    try {
      await initDatabase();
      console.log(`CPUs: ${numCPUs}`);
      console.log("Banco de dados inicializado no Primary com sucesso");
      console.log(`Iniciando serviço de detecções em tempo real`);
      console.log(`Iniciando monitoramento de métricas de threads`);

      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on("message", (worker, message) => {
        if (message && message.type === "THREAD_METRIC" && message.payload) {
          threadMetricsService.addWorkerMetric(message.payload);
        }
      });

      cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} morreu. Recriando...`);
        cluster.fork();
      });

      await realtimeService.start();
      threadMetricsService.startAggregator();
      await logMonitorService.start();
    } catch (err) {
      console.error("Erro ao inicializar primary:", err);
      process.exit(1);
    }
  }

  startPrimary();
} else {
  startWorker();
}