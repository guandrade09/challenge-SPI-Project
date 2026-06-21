import os from "os";
import { connect } from "../api/utils/connection.js";

class RealtimeDetectionService {
  constructor() {
    this.queue = [];
    this.maxQueueSize = 20;
    this.lastId = null;
    this.intervalId = null;
    this.threadMonitorIntervalId = null;
    this.lastCpuUsage = null;
    this.lastCpuCheckTime = null;
  }

  async start() {
    console.log("Iniciando serviço de detecções em tempo real...");

    await this.initializeLastId();
    this.initializeCpuMonitor();
    await this.reportBackendThreadConsumption();

    this.intervalId = setInterval(async () => {
      await this.checkForNewDetections();
    }, 150);

    this.threadMonitorIntervalId = setInterval(async () => {
      await this.reportBackendThreadConsumption();
    }, 300000);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.threadMonitorIntervalId) {
      clearInterval(this.threadMonitorIntervalId);
    }
    console.log("Serviço de detecções em tempo real parado.");
    console.log("Monitor de consumo de threads parado.");
  }

  initializeCpuMonitor() {
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuCheckTime = process.hrtime.bigint();
  }

  getBackendThreadCount() {
    return os.cpus().length;
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

  getProcessLoad() {
    return this.getCurrentCpuLoad();
  }

  async reportBackendThreadConsumption() {
    try {
      const threadCount = this.getBackendThreadCount();
      const processLoad = this.getProcessLoad();
      const payload = {
        thread_name: `backend-process-${process.pid}`,
        quantity_of_cpu_ind_percentage: processLoad,
        process_loaded: threadCount,
      };

      await this.postThreadMetric(payload);
    } catch (error) {
      console.error("Erro ao reportar consumo de threads:", error);
    }
  }

  async postThreadMetric(payload) {
    const urls = [
      "http://localhost:3000/api/threads"
    ];

    for (const url of urls) {
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

        console.log(`[THREAD MONITOR] Métrica enviada`);
        return;
      } catch (error) {
        console.warn(`[THREAD MONITOR] Falha ao enviar para ${url}:`, error.message);
      }
    }

    console.error("[THREAD MONITOR] Não foi possível enviar a métrica para o banco de dados.");
  }

  async initializeLastId() {
    try {
      const db = await connect();
      const result = await db.get("SELECT id FROM detections ORDER BY id DESC LIMIT 1");
      this.lastId = result ? result.id : 0;
      await db.close();
      console.log(`Último ID inicializado: ${this.lastId}`);
    } catch (error) {
      console.error("Erro ao inicializar ID:", error);
    }
  }

  async checkForNewDetections() {
    try {
      const db = await connect();
      const query = "SELECT id, timestamp, label FROM detections WHERE id > ? ORDER BY id ASC";
      const params = [this.lastId];

      const newDetections = await db.all(query, params);
      await db.close();

      for (const detection of newDetections) {
        this.addToQueue(detection);
        this.sendRealtimeUpdate(detection.label);

        // Atualizar último ID
        this.lastId = detection.id;
      }
    } catch (error) {
      console.error("Erro ao verificar novas detecções:", error);
    }
  }

  addToQueue(detection) {
    this.queue.push(detection);

    // Manter apenas os 20 mais recentes
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift(); // Remove o mais antigo
    }

    console.log(`Nova detecção adicionada à fila: ${detection.label}`);
    console.log(`Tamanho da fila: ${this.queue.length}`);
  }

  sendRealtimeUpdate(label) {
    // Aqui você pode integrar com WebSockets, SSE, ou outro mecanismo de tempo real
    // Por enquanto, apenas log no console
    console.log(`[TEMPO REAL] Nova detecção: ${label}`);

    // Exemplo de como seria com Socket.IO (se integrado):
    // if (this.io) {
    //   this.io.emit('new-detection', { label });
    // }
  }

  getQueueHistory() {
    return this.queue;
  }
}

// Exportar instância singleton
const realtimeService = new RealtimeDetectionService();

export default realtimeService;

// Para executar como script standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  realtimeService.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log("Recebido SIGINT. Parando serviço...");
    await realtimeService.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log("Recebido SIGTERM. Parando serviço...");
    await realtimeService.stop();
    process.exit(0);
  });
}