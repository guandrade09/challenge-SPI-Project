import express from "express";
import detectionRoutes from "./routes/detection.routes.js";
import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { ErrorHandler } from "./utils/appError.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api", detectionRoutes);
app.use("/api", authRoutes);
app.use("/api", reportRoutes);

app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === "entity.parse.failed")) {
    return ErrorHandler.handle(res, ErrorHandler.create("JSON inválido", 400));
  }

  return ErrorHandler.handle(res, err);
});

export default app;