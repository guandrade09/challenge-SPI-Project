import cluster from "cluster";
import os from "os";
import app from "./app.js";
import { initDatabase } from "./config/database.js";
import realtimeService from "../services/realtime-service.js";
import threadMetricsService from "../services/thread-metrics.service.js";
import logMonitorService from "../services/log-monitor.service.js";
import {
  computeBackendCores,
  pinProcessToCore,
  pinProcessToCores,
} from "./utils/cpuAffinity.js";

const numCPUs = os.cpus().length;
const PORT = 3000;

const backendCores = computeBackendCores();
const useCluster = process.env.NO_CLUSTER !== "1";

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

async function startSingleProcess() {
  try {
    pinProcessToCores(process.pid, backendCores);
    await initDatabase();
    console.log("Banco de dados inicializado com sucesso");
    console.log("Iniciando serviço de detecções em tempo real");
    console.log("Iniciando monitoramento de métricas de threads");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} (sem cluster)`);
    });

    await realtimeService.start();
    threadMetricsService.startAggregator();
    threadMetricsService.startWorker();
    await logMonitorService.start();
  } catch (err) {
    console.error("Erro ao inicializar servidor:", err);
    process.exit(1);
  }
}

async function startPrimary() {
  try {
    await initDatabase();
    console.log(`CPUs: ${numCPUs} (backend usando núcleos ${backendCores.join(",")})`);
    console.log("Banco de dados inicializado no Primary com sucesso");
    console.log(`Iniciando serviço de detecções em tempo real`);
    console.log(`Iniciando monitoramento de métricas de threads`);

    const workerCores = new Map();
    const forkWorker = (core) => {
      const worker = cluster.fork();
      workerCores.set(worker.id, core);
      worker.on("online", () => pinProcessToCore(worker.process.pid, core));
      return worker;
    };

    for (const core of backendCores) {
      forkWorker(core);
    }

    cluster.on("message", (worker, message) => {
      if (message && message.type === "THREAD_METRIC" && message.payload) {
        threadMetricsService.addWorkerMetric(message.payload);
      }
    });

    cluster.on("exit", (worker) => {
      const core = workerCores.get(worker.id) ?? backendCores[0];
      workerCores.delete(worker.id);
      console.log(`Worker ${worker.process.pid} morreu. Recriando no núcleo ${core}...`);
      forkWorker(core);
    });

    await realtimeService.start();
    threadMetricsService.startAggregator();
    await logMonitorService.start();
  } catch (err) {
    console.error("Erro ao inicializar primary:", err);
    process.exit(1);
  }
}

if (!useCluster) {
  startSingleProcess();
} else if (cluster.isPrimary) {
  startPrimary();
} else {
  startWorker();
}