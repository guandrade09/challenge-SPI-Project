import express from "express";
import detectionRoutes from "./routes/detection.routes.js";
import { initDatabase } from "./config/database.js";

const app = express();

app.use(express.json());
app.use("/api", detectionRoutes);

async function startServer() {
  await initDatabase();

  app.listen(3000, () => {
    console.log("API rodando em http://localhost:3000");
  });
}

startServer();