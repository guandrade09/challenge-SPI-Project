import { connect } from "../utils/connection.js";

export async function saveChatMessage(message) {
  const db = await connect();

  const query = `
    INSERT INTO chat_messages (timestamp, user_id, role, content, model, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = await db.run(query, [
    message.timestamp,
    message.user_id,
    message.role,
    message.content,
    message.model,
    message.metadata,
  ]);

  return result;
}

export async function getChatHistory({ user_id, limit = 100 }) {
  const db = await connect();

  const query = user_id
    ? `SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?`
    : `SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?`;

  return user_id
    ? db.all(query, [user_id, limit])
    : db.all(query, [limit]);
}
