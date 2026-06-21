import express from "express";
import detectionRoutes from "./routes/detection.routes.js";
import confidenceRoutes from "./routes/confidence.routes.js";
import zonaRoutes from "./routes/zona.routes.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use("/api", detectionRoutes);
app.use("/api", confidenceRoutes);
app.use("/api", zonaRoutes);

export default app;