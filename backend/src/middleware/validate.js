/**
 * Request Validation Middleware using Zod
 */

function validateRequest(schemas = {}) {
  return (req, res, next) => {
    const targets = ['body', 'query', 'params'];
    const errors = [];

    for (const target of targets) {
      if (schemas[target]) {
        const result = schemas[target].safeParse(req[target]);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            const fieldPath = issue.path.join('.') || target;
            let message = issue.message;

            // Sanitize message: never leak sensitive parameters
            if (
              fieldPath.toLowerCase().includes('password') ||
              fieldPath.toLowerCase().includes('secret') ||
              fieldPath.toLowerCase().includes('token')
            ) {
              message = message.replace(/'[^']*'/g, '[REDACTED]').replace(/"[^"]*"/g, '[REDACTED]');
            }

            errors.push({
              source: target,
              field: fieldPath,
              message,
            });
          });
        } else {
          // Replace with parsed/coerced data
          req[target] = result.data;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
    }

    next();
  };
}

module.exports = {
  validateRequest,
};
