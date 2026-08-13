import { Router } from "express";
import { postChatMessage, getChatHistory } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/chat",  postChatMessage);
router.get("/chat/history",  getChatHistory);

export default router;
