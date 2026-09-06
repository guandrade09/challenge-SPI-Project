import { Router } from "express";
import { register, listThreads, getByThreadName, getByTimestamp } from "../controllers/thread.controller.js";

const router = Router();

router.post("/threads", register);
router.get("/threads", listThreads);
router.get("/threads/name/:thread_name", getByThreadName);
router.get("/threads/timestamp/:timestamp", getByTimestamp);

export default router;