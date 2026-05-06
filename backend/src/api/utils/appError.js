export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const handleError = (res, error) => {
  return res.status(error.statusCode || 500).json({
    error: error.message || "Erro interno do servidor",
  });
};
