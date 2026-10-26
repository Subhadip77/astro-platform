const { config } = require('../config');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

function errorHandler(err, req, res, next) {
  // If response already committed, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProd = config.server.isProduction;

  // Log error
  if (!isProd && statusCode >= 500) {
    console.error('[SERVER ERROR]', err);
  }

  const response = {
    success: false,
    error: {
      code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
      message: statusCode === 500 && isProd ? 'An unexpected internal error occurred.' : err.message,
    },
  };

  if (!isProd && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
