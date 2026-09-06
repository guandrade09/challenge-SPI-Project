import fs from "fs/promises";
import path from "path";

class LogMonitorService {
  constructor() {
    this.logsDir = path.join(process.cwd(), "logs");
    this.logsFile = path.join(this.logsDir, "realtime-log.json");
    this.maxEntries = 15;
    this.intervalId = null;
  }

  async start(intervalMs = 1000) {
    if (this.intervalId) {
      return;
    }

    await this.ensureLogFileExists();
    this.intervalId = setInterval(() => this.trimOldEntries(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
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

  async writeEntries(entries) {
    await fs.mkdir(this.logsDir, { recursive: true });
    await fs.writeFile(this.logsFile, JSON.stringify(entries, null, 2), "utf8");
  }

  async appendEntry(entry) {
    const entries = await this.readEntries();
    entries.push(entry);
    await this.writeEntries(this.trimEntries(entries));
  }

  async trimOldEntries() {
    const entries = await this.readEntries();
    const trimmed = this.trimEntries(entries);
    if (trimmed.length !== entries.length) {
      await this.writeEntries(trimmed);
    }
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
