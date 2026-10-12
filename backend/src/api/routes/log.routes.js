import { Router } from "express";
import { listLogs, removeLog } from "../controllers/log.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/logs", listLogs);
router.delete("/logs/:id", authMiddleware, removeLog);

export default router;
