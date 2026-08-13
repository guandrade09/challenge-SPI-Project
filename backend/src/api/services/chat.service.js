import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ChatMessage from "../models/chat.model.js";
import { saveChatMessage, getChatHistory } from "../repositories/chat.repository.js";
import { normalizeBrasiliaTimestamp } from "../utils/convert.js";
import { AppError } from "../utils/appError.js";
import { REPORT_TOOLS } from "../utils/prompt/report-tools.js";
import { executeReportTool } from "../utils/prompt/report-tool-executor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OLLAMA_CLOUD_URL = process.env.OLLAMA_CLOUD_URL || "https://ollama.com/api/chat";
const OLLAMA_API_KEY = "41b6aba977c5459e9cf7c043122e1a12.5Lm5MYEus9ve1PNU_k3t6Fw6";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";
const MAX_TOOL_ITERATIONS = 100;

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

    // Se o modelo não pediu nenhuma tool, é a resposta final
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content.trim();
    }

    // Adiciona a mensagem do assistant (com as tool_calls) ao histórico da conversa
    currentMessages.push(message);

    // Executa cada tool chamada e adiciona o resultado como mensagem "tool"
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
    // volta pro loop: manda tudo de novo pro modelo formular a resposta final
  }

  throw new Error("Número máximo de chamadas de ferramentas excedido");
}

export async function sendMessage({ user_id, content, model }) {
  if (!content || typeof content !== "string") {
    throw new AppError("Conteúdo da mensagem inválido", 400);
  }

  const timestamp = normalizeBrasiliaTimestamp();
  const modelName = model || OLLAMA_MODEL;

  const userMessage = new ChatMessage({
    timestamp,
    user_id,
    role: "user",
    content,
    model: modelName,
  });

  await saveChatMessage(userMessage);

  const history = await getChatHistory({ user_id, limit: 10 });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content },
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
  });

  await saveChatMessage(assistantMessage);

  return assistantMessage.content;
}

export async function fetchHistory({ user_id, limit }) {
  const history = await getChatHistory({ user_id, limit });
  return history.map((message) => ({
    ...message,
    metadata: message.metadata ? JSON.parse(message.metadata) : null,
  }));
}