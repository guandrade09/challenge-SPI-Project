export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  static create(message, statusCode = 500) {
    return new AppError(message, statusCode);
  }

  static handle(res, error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    // Erros 4xx são falhas de negócio deliberadas (ex.: "Conversa não encontrada")
    // e sua mensagem é segura para o cliente. Erros 5xx são inesperados e podem
    // conter detalhes internos (texto de outra API, motivo de falha de banco...);
    // esses ficam só no log do servidor, nunca na resposta.
    if (statusCode >= 500) {
      console.error("[ERROR]", error);
      return res.status(statusCode).json({ error: "Erro interno do servidor" });
    }

    return res.status(statusCode).json({
      error: error.message || "Erro interno do servidor",
    });
  }
}

export const handleError = (res, error) => ErrorHandler.handle(res, error);
