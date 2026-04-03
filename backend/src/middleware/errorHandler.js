export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "Unexpected server error";

  res.status(status).json({
    requestId: req.requestId,
    status: "error",
    error: {
      code,
      message
    }
  });
}
