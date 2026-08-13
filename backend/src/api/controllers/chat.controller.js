import { sendMessage, fetchHistory } from "../services/chat.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function postChatMessage(req, res) {
  try {
    const { content, model } = req.body;
    const user_id = req.user?.id || null;

    const message = await sendMessage({ user_id, content, model });

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
