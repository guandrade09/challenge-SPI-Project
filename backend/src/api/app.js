import express from "express";
import cors from "cors";
import detectionRoutes from "./routes/detection.routes.js";
import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import threadRoutes from "./routes/thread.routes.js";
import logRoutes from "./routes/log.routes.js";
<<<<<<< HEAD
import chatRoutes from "./routes/chat.routes.js";
=======
import cameraRoutes from "./routes/camera.routes.js";

>>>>>>> b0983b9301d09378ef9c9884ccd0756f53730516
import { ErrorHandler } from "./utils/appError.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3300"],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'Content-Length']
}));

app.use(express.json({ limit: "50mb" }));
app.use("/api", detectionRoutes);
app.use("/api", authRoutes);
app.use("/api", reportRoutes);
app.use("/api", threadRoutes);
app.use("/api", logRoutes);
<<<<<<< HEAD
app.use("/api", chatRoutes);
=======
app.use("/api", cameraRoutes);

>>>>>>> b0983b9301d09378ef9c9884ccd0756f53730516

app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === "entity.parse.failed")) {
    return ErrorHandler.handle(res, ErrorHandler.create("JSON inválido", 400));
  }

  return ErrorHandler.handle(res, err);
});

export default app;