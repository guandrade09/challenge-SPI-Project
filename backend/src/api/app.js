import express from "express";
import detectionRoutes from "./routes/detection.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use("/api", detectionRoutes);
app.use("/api", authRoutes);

export default app;