import { Router } from "express";
import {
  postChatMessage,
  getChatHistory,
  getConversations,
  getConversationsByDay,
  getConversationDetail,
  patchConversationTitle,
  deleteConversation,
} from "../controllers/chat.controller.js";

const router = Router();

router.post("/chat", postChatMessage);
router.get("/chat/history", getChatHistory);
router.get("/chat/conversations", getConversations);
router.get("/chat/history/day/:day", getConversationsByDay);
router.get("/chat/conversation/:conversation_id", getConversationDetail);
router.patch("/chat/conversation/title", patchConversationTitle);
router.delete("/chat/conversation/:conversation_id", deleteConversation);

export default router;
