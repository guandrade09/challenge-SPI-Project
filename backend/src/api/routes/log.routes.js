import { Router } from "express";
import { listLogs } from "../controllers/log.controller.js";

const router = Router();

router.get("/logs", listLogs);

export default router;
