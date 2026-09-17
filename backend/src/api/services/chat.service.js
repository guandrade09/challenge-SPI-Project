import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ChatMessage from "../models/chat.model.js";
import {
  saveChatMessage,
  getChatHistory,
  getChatConversations,
  getConversationMessages,
  saveChatConversation,
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  ensureTablesInitialized,
} from "../repositories/chat.repository.js";
import { normalizeBrasiliaTimestamp } from "../utils/convert.js";
import { AppError } from "../utils/appError.js";
import { REPORT_TOOLS } from "../utils/prompt/report-tools.js";
import { executeReportTool } from "../utils/prompt/report-tool-executor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_CLOUD_URL = process.env.OLLAMA_CLOUD_URL || "https://ollama.com/api/chat";
const OLLAMA_API_KEY = "d3afa6c519104f5aab3af48be9c007cf.a6xAHVOiRYTHv3Jfeom4oGpB";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";
const MAX_TOOL_ITERATIONS = 100;

let tablesInitialized = false;

const SYSTEM_PROMPT = readFileSync(
  path.join(__dirname, "../utils/prompt/system-prompt.md"),
  "utf-8"
);

async function callOllamaChat(messages, model = OLLAMA_MODEL) {
  if (!OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY não definida nas variáveis de ambiente");
  }

  const response = await fetch(OLLAMA_CLOUD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools: REPORT_TOOLS,
      stream: false,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro Ollama Cloud (${response.status}): ${text}`);
  }

  return response.json();
}

async function runConversation(messages, model) {
  let currentMessages = [...messages];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const data = await callOllamaChat(currentMessages, model);
    const message = data.message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content.trim();
    }

    currentMessages.push(message);

    for (const toolCall of message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      let result;
      try {
        result = await executeReportTool(name, args);
      } catch (err) {
        result = { error: err.message };
      }

      currentMessages.push({
        role: "tool",
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("Número máximo de chamadas de ferramentas excedido");
}

async function ensureChatInitialized() {
  if (!tablesInitialized) {
    await ensureTablesInitialized();
    tablesInitialized = true;
  }
}

async function ensureConversation({ user_id, content, timestamp, conversation_id = null }) {
  if (conversation_id) {
    const existing = await getConversationById({ user_id, conversation_id });
    if (!existing) {
      throw new AppError("Conversa não encontrada", 404);
    }
    return existing;
  }

  const dayKey = (timestamp || normalizeBrasiliaTimestamp()).slice(0, 10);
  const sameDay = (await getChatConversations({ user_id, limit: 1000 })).filter(
    (conversation) => conversation.started_at && conversation.started_at.slice(0, 10) === dayKey
  );

  const nextIndex = sameDay.length > 0
    ? Math.max(...sameDay.map((conversation) => Number(conversation.day_index || 1))) + 1
    : 1;

  return saveChatConversation({
    user_id,
    title: String(content || "Nova conversa").trim().slice(0, 80) || "Nova conversa",
    started_at: timestamp || normalizeBrasiliaTimestamp(),
    day_index: nextIndex,
    title_is_custom: 0,
  });
}

export async function sendMessage({ user_id, content, model, conversation_id = null }) {
  await ensureChatInitialized();

  if (!content || typeof content !== "string") {
    throw new AppError("Conteúdo da mensagem inválido", 400);
  }

  const timestamp = normalizeBrasiliaTimestamp();
  const modelName = model || OLLAMA_MODEL;
  const conversation = await ensureConversation({ user_id, content, timestamp, conversation_id });

  const userMessage = new ChatMessage({
    timestamp,
    user_id,
    role: "user",
    content,
    model: modelName,
    conversation_id: conversation.id,
  });

  await saveChatMessage(userMessage);

  if (!conversation.title_is_custom) {
    const latestUser = [...(await getConversationMessages({ conversation_id: conversation.id, user_id, limit: 100 }))]
      .reverse()
      .find((message) => message.role === "user");

    if (latestUser) {
      const autoTitle = String(latestUser.content || "Nova conversa").trim().slice(0, 80) || "Nova conversa";
      await updateConversationTitle({ user_id, conversation_id: conversation.id, title: autoTitle, title_is_custom: false });
    }
  }

  const history = await getConversationMessages({
    conversation_id: conversation.id,
    user_id,
    limit: 100,
  });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  let assistantContent;
  try {
    assistantContent = await runConversation(messages, modelName);
  } catch (err) {
    throw new AppError(`Falha ao consultar o modelo: ${err.message}`, 502);
  }

  const assistantMessage = new ChatMessage({
    timestamp: normalizeBrasiliaTimestamp(),
    user_id,
    role: "assistant",
    content: assistantContent,
    model: modelName,
    conversation_id: conversation.id,
  });

  await saveChatMessage(assistantMessage);

  const updatedConversation = await getConversationById({ user_id, conversation_id: conversation.id });

  return {
    content: assistantMessage.content,
    conversation_id: updatedConversation.id,
    conversation_title: updatedConversation.title,
    started_at: updatedConversation.started_at,
    day_index: updatedConversation.day_index,
  };
}

export async function fetchHistory({ user_id, limit }) {
  await ensureChatInitialized();

  const history = await getChatHistory({ user_id, limit });
  return history.map((message) => ({
    ...message,
    metadata: message.metadata ? JSON.parse(message.metadata) : null,
  }));
}

export async function fetchConversations({ user_id, limit = 100 }) {
  await ensureChatInitialized();

  const conversations = await getChatConversations({ user_id, limit });
  const results = [];

  for (const conversation of conversations) {
    const messages = await getConversationMessages({
      conversation_id: conversation.id,
      user_id,
      limit: 1000,
    });

    results.push({
      id: conversation.id,
      conversation_id: conversation.id,
      title: conversation.title,
      started_at: conversation.started_at,
      day: conversation.started_at ? conversation.started_at.slice(0, 10) : null,
      day_index: conversation.day_index || 1,
      count: messages.length,
      messages: messages.map((message) => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null,
      })),
    });
  }

  return results;
}

export async function fetchConversationByDay({ user_id, day, limit = 100 }) {
  await ensureChatInitialized();

  const conversations = await getChatConversations({ user_id, limit: 1000 });
  const subset = conversations.filter(
    (conversation) => conversation.started_at && conversation.started_at.slice(0, 10) === day
  );

  const results = [];
  for (const conversation of subset) {
    const messages = await getConversationMessages({
      conversation_id: conversation.id,
      user_id,
      limit,
    });

    results.push({
      id: conversation.id,
      conversation_id: conversation.id,
      title: conversation.title,
      started_at: conversation.started_at,
      day: conversation.started_at ? conversation.started_at.slice(0, 10) : null,
      day_index: conversation.day_index || 1,
      count: messages.length,
      messages: messages.map((message) => ({
        ...message,
        metadata: message.metadata ? JSON.parse(message.metadata) : null,
      })),
    });
  }

  return results;
}

export async function fetchConversationMessages({ user_id, conversation_id, limit = 100 }) {
  await ensureChatInitialized();

  const conversation = await getConversationById({ user_id, conversation_id });
  if (!conversation) {
    throw new AppError("Conversa não encontrada", 404);
  }

  const messages = await getConversationMessages({
    conversation_id,
    user_id,
    limit,
  });

  return {
    id: conversation.id,
    conversation_id: conversation.id,
    title: conversation.title,
    started_at: conversation.started_at,
    day: conversation.started_at ? conversation.started_at.slice(0, 10) : null,
    day_index: conversation.day_index || 1,
    count: messages.length,
    messages: messages.map((message) => ({
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
    })),
  };
}

export async function updateConversationTitleService({ user_id, conversation_id, title }) {
  await ensureChatInitialized();

  if (!conversation_id) {
    throw new AppError("Conversa não informada", 400);
  }

  const safeTitle = String(title || "").trim();
  if (!safeTitle) {
    throw new AppError("Título inválido", 400);
  }

  const conversation = await getConversationById({ user_id, conversation_id });
  if (!conversation) {
    throw new AppError("Conversa não encontrada", 404);
  }

  await updateConversationTitle({ user_id, conversation_id, title: safeTitle.slice(0, 80), title_is_custom: true });

  return {
    ...conversation,
    title: safeTitle.slice(0, 80),
    title_is_custom: 1,
  };
}

export async function deleteConversationService({ user_id, conversation_id }) {
  await ensureChatInitialized();

  if (!conversation_id) {
    throw new AppError("Conversa não informada", 400);
  }

  const conversation = await getConversationById({ user_id, conversation_id });
  if (!conversation) {
    throw new AppError("Conversa não encontrada", 404);
  }

  await deleteConversation({ user_id, conversation_id });

  return { message: "Conversa deletada com sucesso" };
}