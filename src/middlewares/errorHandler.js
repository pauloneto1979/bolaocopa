function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || "Erro interno do servidor."
    }
  });
}

module.exports = { errorHandler };
