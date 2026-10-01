import { clearChatHistory } from "./src/api/config/database.js";

(async () => {
  try {
    await clearChatHistory();
    process.exit(0);
  } catch (err) {
    console.error("Erro ao limpar histórico:", err.message);
    process.exit(1);
  }
})();
