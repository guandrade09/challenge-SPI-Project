import {
  sendMessage,
  fetchHistory,
  fetchConversations,
  fetchConversationByDay,
  fetchConversationMessages,
  updateConversationTitleService,
  deleteConversationService,
} from "../services/chat.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function postChatMessage(req, res) {
  try {
    const { content, model, conversation_id } = req.body;
    const user_id = req.user?.id || null;

    const message = await sendMessage({ user_id, content, model, conversation_id });

    return res.status(200).json({
      message: "Resposta gerada com sucesso",
      data: message,
    });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getChatHistory(req, res) {
  try {
    const user_id = req.user?.id || null;
    const limit = Number(req.query.limit) || 100;

    const history = await fetchHistory({ user_id, limit });

    return res.status(200).json({
      count: history.length,
      data: history,
    });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getConversations(req, res) {
  try {
    const user_id = req.user?.id || null;
    const limit = Number(req.query.limit) || 100;
    const conversations = await fetchConversations({ user_id, limit });

    return res.status(200).json({
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getConversationsByDay(req, res) {
  try {
    const user_id = req.user?.id || null;
    const { day } = req.params;
    const limit = Number(req.query.limit) || 100;
    const conversations = await fetchConversationByDay({ user_id, day, limit });

    return res.status(200).json({
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function getConversationDetail(req, res) {
  try {
    const user_id = req.user?.id || null;
    const { conversation_id } = req.params;
    const limit = Number(req.query.limit) || 100;

    const conversation = await fetchConversationMessages({
      user_id,
      conversation_id: Number(conversation_id),
      limit,
    });

    return res.status(200).json({ data: conversation });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function patchConversationTitle(req, res) {
  try {
    const user_id = req.user?.id || null;
    const { conversation_id, title } = req.body;

    const conversation = await updateConversationTitleService({
      user_id,
      conversation_id: Number(conversation_id),
      title,
    });

    return res.status(200).json({
      message: "Título atualizado com sucesso",
      data: conversation,
    });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function deleteConversation(req, res) {
  try {
    const user_id = req.user?.id || null;
    const { conversation_id } = req.params;

    const result = await deleteConversationService({
      user_id,
      conversation_id: Number(conversation_id),
    });

    return res.status(200).json({
      message: result.message,
      data: result,
    });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}
