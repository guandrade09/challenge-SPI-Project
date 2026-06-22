import os from "os";
import path from "path";
import fs from "fs/promises";
import { connect } from "../api/utils/connection.js";
import { normalizeBrasiliaTimestamp } from "../api/utils/convert.js";
import logMonitorService from "./log-monitor.service.js";

class RealtimeDetectionService {
  constructor() {
    this.lastId = null;
    this.intervalId = null;
    this.lastCpuUsage = null;
    this.lastCpuCheckTime = null;
  }

  async start() {
    await this.initializeLastId();

    this.intervalId = setInterval(async () => {
      await this.checkForNewDetections();
    }, 150);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log("Serviço de detecções em tempo real parado.");
  }

  async initializeLastId() {
    try {
      const db = await connect();
      const result = await db.get("SELECT id FROM detections ORDER BY id DESC LIMIT 1");
      this.lastId = result ? result.id : 0;
      await db.close();

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
        this.sendRealtimeUpdate(detection.label);
        this.lastId = detection.id;
      }
    } catch (error) {
      console.error("Erro ao verificar novas detecções:", error);
    }
  }

  sendRealtimeUpdate(label) {
    const entry = {
      timestamp: normalizeBrasiliaTimestamp(new Date()),
      line: `[TEMPO REAL] Nova detecção: ${label}`
    };

    this.writeLogEntry(entry).catch(err => {
      console.error('Erro ao gravar arquivo de log JSON:', err);
    });

  }

  async writeLogEntry(entry) {
    await logMonitorService.appendEntry(entry);
  }

}

const realtimeService = new RealtimeDetectionService();

export default realtimeService;

if (import.meta.url === `file://${process.argv[1]}`) {
  realtimeService.start();

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