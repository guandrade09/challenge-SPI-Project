import fs from "fs/promises";
import path from "path";

class LogMonitorService {
  constructor() {
    this.logsDir = path.join(process.cwd(), "logs");
    this.logsFile = path.join(this.logsDir, "realtime-log.json");
    this.maxEntries = 15;
    this.started = false;
    // Fila de escritas: serializa read-modify-write dentro do processo (sem perder entradas)
    this.writeQueue = Promise.resolve();
  }

  async start() {
    if (this.started) {
      return;
    }

    await this.ensureLogFileExists();
    this.started = true;
  }

  stop() {
    this.started = false;
  }

  async ensureLogFileExists() {
    await fs.mkdir(this.logsDir, { recursive: true });
    try {
      await fs.access(this.logsFile);
    } catch (error) {
      await fs.writeFile(this.logsFile, "[]", "utf8");
    }
  }

  async readEntries() {
    try {
      const content = await fs.readFile(this.logsFile, "utf8");
      const entries = JSON.parse(content || "[]");
      return Array.isArray(entries) ? entries : [];
    } catch (error) {
      return [];
    }
  }

  // Escrita atômica (tmp + rename): um leitor nunca enxerga o JSON pela metade —
  // antes isso fazia readEntries devolver [] e o próximo append apagar o histórico.
  async writeEntries(entries) {
    await fs.mkdir(this.logsDir, { recursive: true });
    const tmpFile = `${this.logsFile}.${process.pid}.tmp`;
    const data = JSON.stringify(entries, null, 2);

    await fs.writeFile(tmpFile, data, "utf8");
    try {
      await fs.rename(tmpFile, this.logsFile);
    } catch (error) {
      // No Windows o rename pode falhar (EPERM/EBUSY) se outro processo está lendo o arquivo
      await fs.writeFile(this.logsFile, data, "utf8");
      await fs.rm(tmpFile, { force: true });
    }
  }

  appendEntry(entry) {
    const task = this.writeQueue.then(async () => {
      const entries = await this.readEntries();
      entries.push(entry);
      await this.writeEntries(this.trimEntries(entries));
    });
    // a fila não pode ficar "envenenada" por uma falha; o chamador ainda recebe o erro
    this.writeQueue = task.catch(() => {});
    return task;
  }

  trimEntries(entries) {
    if (entries.length <= this.maxEntries) {
      return entries;
    }
    return entries.slice(entries.length - this.maxEntries);
  }
}

const logMonitorService = new LogMonitorService();
export default logMonitorService;
