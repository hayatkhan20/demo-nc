export function errorHandler(err, req, res, _next) {
  const code = err.status || 500;
  res.status(code).json({
    error: { code, message: err.message || 'Internal Server Error' }
  });
}
