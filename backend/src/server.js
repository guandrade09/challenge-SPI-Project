import cluster from "cluster";
import os from "os";
import app from "./app.js";
import { initDatabase } from "./config/database.js";

const numCPUs = os.cpus().length;
const PORT = 3000;

if (cluster.isPrimary) {
  console.log(`🚀 Master ${process.pid} rodando`);
  console.log(`🔥 CPUs: ${numCPUs}`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`💀 Worker ${worker.process.pid} morreu`);
    console.log("♻️ Criando outro...");
    cluster.fork();
  });

} else {
  async function startWorker() {
    try {
      await initDatabase();

      app.listen(PORT, () => {
        console.log(`Worker ${process.pid} rodando na porta ${PORT}`);
      });

    } catch (err) {
      console.error("Erro ao iniciar worker:", err);
      process.exit(1);
    }
  }

  startWorker();
}