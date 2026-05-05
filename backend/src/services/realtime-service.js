import { connect } from "../api/utils/connection.js";

class RealtimeDetectionService {
  constructor() {
    this.queue = [];
    this.maxQueueSize = 20;
    this.lastId = null;
    this.intervalId = null;
  }

  async start() {
    console.log("Iniciando serviço de detecções em tempo real...");

    // Inicializar último ID
    await this.initializeLastId();

    // Verificar novas detecções a cada 150ms
    this.intervalId = setInterval(async () => {
      await this.checkForNewDetections();
    }, 150);

    console.log("Serviço iniciado. Verificando novas detecções a cada 150ms.");
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log("Serviço de detecções em tempo real parado.");
    }
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