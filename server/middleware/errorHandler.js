export function notFoundHandler(req, res, next) {
  res.status(404).json({ status: 'fail', message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  // body-parser / multer / http-errors expose `status` or `statusCode`
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = err.isOperational || (statusCode >= 400 && statusCode < 500);

  if (!isOperational && process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  } else if (!isOperational) {
    console.error('[error]', err.message);
  }

  const fallbackMessage =
    statusCode === 413
      ? 'Uploaded content is too large. Images max 5 MB, video max 50 MB.'
      : 'Something went wrong. Please try again later.';

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: isOperational && err.message ? err.message : fallbackMessage,
  });
}
