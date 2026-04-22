import express from "express";
import detectionRoutes from "./routes/detection.routes.js";
import confidenceRoutes from "./routes/confidence.routes.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use("/api", detectionRoutes);
app.use("/api", confidenceRoutes);

export default app;