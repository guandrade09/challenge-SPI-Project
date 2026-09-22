import cluster from "cluster";
import os from "os";
import app from "./app.js";
import { initDatabase } from "./config/database.js";
import realtimeService from "../services/realtime-service.js";
import threadMetricsService from "../services/thread-metrics.service.js";
import logMonitorService from "../services/log-monitor.service.js";

const numCPUs = os.cpus().length;
const PORT = 3000;

const WORKER_MIN_UPTIME_MS = 10000;
const MAX_QUICK_DEATHS = 5;
const RESTART_DELAY_MS = 1000;

<<<<<<< Updated upstream
=======
const backendCores = computeBackendCores();

>>>>>>> Stashed changes
// NO_CLUSTER=1: roda um único processo (sem cluster.fork()). Útil pra teste local
// onde o orquestrador de ML e o navegador já disputam CPU — um Node por núcleo
// só pra servir uma API local de dev soma pressão desnecessária.
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
    console.log(`CPUs: ${numCPUs}`);
    console.log("Banco de dados inicializado no Primary com sucesso");
    console.log(`Iniciando serviço de detecções em tempo real`);
    console.log(`Iniciando monitoramento de métricas de threads`);

<<<<<<< Updated upstream
    const forkTimes = new Map(); // pid → instante do fork
    let quickDeaths = 0;

    const forkWorker = () => {
      const worker = cluster.fork();
      forkTimes.set(worker.process.pid, Date.now());
=======
    const workerCores = new Map(); // worker.id → núcleo em que ele fica fixado
    const forkTimes = new Map();   // worker.id → instante do fork
    let quickDeaths = 0;

    const forkWorker = (core) => {
      const worker = cluster.fork();
      workerCores.set(worker.id, core);
      forkTimes.set(worker.id, Date.now());
      worker.on("online", () => pinProcessToCore(worker.process.pid, core));
      return worker;
>>>>>>> Stashed changes
    };

    for (let i = 0; i < numCPUs; i++) {
      forkWorker();
    }

    cluster.on("message", (worker, message) => {
      if (message && message.type === "THREAD_METRIC" && message.payload) {
        threadMetricsService.addWorkerMetric(message.payload);
      }
    });

    cluster.on("exit", (worker) => {
<<<<<<< Updated upstream
      const pid = worker.process.pid;
      const lived = Date.now() - (forkTimes.get(pid) ?? 0);
      forkTimes.delete(pid);
=======
      const core = workerCores.get(worker.id) ?? backendCores[0];
      workerCores.delete(worker.id);
      const lived = Date.now() - (forkTimes.get(worker.id) ?? 0);
      forkTimes.delete(worker.id);
>>>>>>> Stashed changes

      // Worker que morre logo após subir (porta ocupada, erro de import...) reiniciaria
      // em loop infinito, consumindo CPU. Depois de várias mortes rápidas seguidas, desiste.
      quickDeaths = lived < WORKER_MIN_UPTIME_MS ? quickDeaths + 1 : 0;
      if (quickDeaths >= MAX_QUICK_DEATHS) {
        console.error(`Workers morrendo logo após iniciar (${quickDeaths}x seguidas). Abortando para evitar loop de restart.`);
        process.exit(1);
      }

<<<<<<< Updated upstream
      console.log(`Worker ${pid} morreu. Recriando...`);
      setTimeout(forkWorker, RESTART_DELAY_MS);
=======
      console.log(`Worker ${worker.process.pid} morreu. Recriando no núcleo ${core}...`);
      setTimeout(() => forkWorker(core), RESTART_DELAY_MS);
>>>>>>> Stashed changes
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