import { connect } from "../utils/connection.js";

export async function ensureTablesInitialized() {
  const db = await connect();

  const conversationColumns = await db.all("PRAGMA table_info(chat_conversations)");
  if (!conversationColumns.some((column) => column.name === "title_is_custom")) {
    await db.exec("ALTER TABLE chat_conversations ADD COLUMN title_is_custom INTEGER NOT NULL DEFAULT 0");
  }

  const messageColumns = await db.all("PRAGMA table_info(chat_messages)");
  const hasConversationId = messageColumns.some((column) => column.name === "conversation_id");
  if (!hasConversationId) {
    await db.exec("ALTER TABLE chat_messages ADD COLUMN conversation_id INTEGER");
  }

  await migrateLegacyMessages();
}

export async function migrateLegacyMessages() {
  const db = await connect();

  const legacyRows = await db.all(
    "SELECT * FROM chat_messages WHERE conversation_id IS NULL ORDER BY timestamp ASC, id ASC"
  );

  if (legacyRows.length === 0) return;

  const grouped = new Map();
  for (const row of legacyRows) {
    const dayKey = (row.timestamp || new Date().toISOString()).slice(0, 10);
    const key = `${row.user_id ?? "anon"}|${dayKey}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  for (const rows of grouped.values()) {
    const sorted = rows.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const startedAt = sorted[0]?.timestamp || new Date().toISOString();
    const lastUser = [...sorted].reverse().find((row) => row.role === "user");
    const title = lastUser
      ? String(lastUser.content || "Nova conversa").trim().slice(0, 80) || "Nova conversa"
      : "Nova conversa";

    const previous = await db.get(
      "SELECT id, day_index FROM chat_conversations WHERE user_id = ? AND date(started_at) = ? ORDER BY id DESC LIMIT 1",
      [sorted[0].user_id ?? null, startedAt.slice(0, 10)]
    );

    const nextIndex = previous ? Number(previous.day_index || 1) + 1 : 1;
    const saveResult = await db.run(
      "INSERT INTO chat_conversations (user_id, title, started_at, day_index, created_at) VALUES (?, ?, ?, ?, ?)",
      [sorted[0].user_id ?? null, title, startedAt, nextIndex, startedAt]
    );

    for (const row of sorted) {
      await db.run("UPDATE chat_messages SET conversation_id = ? WHERE id = ?", [saveResult.lastID, row.id]);
    }
  }
}

export async function saveChatConversation({ user_id, title, started_at, day_index }) {
  const db = await connect();
  const createdAt = started_at || new Date().toISOString();

  const result = await db.run(
    `
      INSERT INTO chat_conversations (user_id, title, started_at, day_index, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [user_id ?? null, String(title || "Nova conversa").trim().slice(0, 80), createdAt, day_index || 1, createdAt]
  );

  return {
    id: result.lastID,
    user_id: user_id ?? null,
    title: String(title || "Nova conversa").trim().slice(0, 80),
    started_at: createdAt,
    day_index: day_index || 1,
    created_at: createdAt,
  };
}

export async function getConversationById({ user_id, conversation_id }) {
  const db = await connect();
  const query = user_id
    ? `SELECT * FROM chat_conversations WHERE id = ? AND user_id = ? LIMIT 1`
    : `SELECT * FROM chat_conversations WHERE id = ? LIMIT 1`;

  return user_id
    ? db.get(query, [conversation_id, user_id])
    : db.get(query, [conversation_id]);
}

export async function getConversationMessages({ conversation_id, user_id, limit = 100 }) {
  const db = await connect();
  const query = user_id
    ? `SELECT * FROM chat_messages WHERE conversation_id = ? AND user_id = ? ORDER BY id ASC LIMIT ?`
    : `SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?`;

  return user_id
    ? db.all(query, [conversation_id, user_id, limit])
    : db.all(query, [conversation_id, limit]);
}

export async function getChatConversations({ user_id, limit = 100 }) {
  const db = await connect();
  const query = user_id
    ? `SELECT * FROM chat_conversations WHERE user_id = ? ORDER BY started_at DESC, id DESC LIMIT ?`
    : `SELECT * FROM chat_conversations ORDER BY started_at DESC, id DESC LIMIT ?`;

  return user_id
    ? db.all(query, [user_id, limit])
    : db.all(query, [limit]);
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

export async function saveChatMessage(message) {
  const db = await connect();

  const query = `
    INSERT INTO chat_messages (conversation_id, timestamp, user_id, role, content, model, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await db.run(query, [
    message.conversation_id ?? null,
    message.timestamp,
    message.user_id,
    message.role,
    message.content,
    message.model,
    message.metadata,
  ]);

  return result;
}

export async function updateConversationTitle({ user_id, conversation_id, title, title_is_custom = true }) {
  const db = await connect();
  const safeTitle = String(title || "Nova conversa").trim().slice(0, 80) || "Nova conversa";

  const query = user_id
    ? `UPDATE chat_conversations SET title = ?, title_is_custom = ? WHERE id = ? AND user_id = ?`
    : `UPDATE chat_conversations SET title = ?, title_is_custom = ? WHERE id = ?`;

  return user_id
    ? db.run(query, [safeTitle, title_is_custom ? 1 : 0, conversation_id, user_id])
    : db.run(query, [safeTitle, title_is_custom ? 1 : 0, conversation_id]);
}

export async function deleteConversation({ user_id, conversation_id }) {
  const db = await connect();

  if (user_id) {
    await db.run("DELETE FROM chat_messages WHERE conversation_id = ? AND user_id = ?", [conversation_id, user_id]);
    await db.run("DELETE FROM chat_conversations WHERE id = ? AND user_id = ?", [conversation_id, user_id]);
  } else {
    await db.run("DELETE FROM chat_messages WHERE conversation_id = ?", [conversation_id]);
    await db.run("DELETE FROM chat_conversations WHERE id = ?", [conversation_id]);
  }
}

