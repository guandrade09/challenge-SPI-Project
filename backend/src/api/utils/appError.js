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
    const message = error.message || "Erro interno do servidor";

    return res.status(statusCode).json({
      error: message,
    });
  }
}

export const handleError = (res, error) => ErrorHandler.handle(res, error);
