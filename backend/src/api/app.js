import express from "express";
import detectionRoutes from "./routes/detection.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api", detectionRoutes);
app.use("/api", authRoutes);

export default app;