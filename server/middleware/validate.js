import AppError from '../utils/AppError.js';

/** Removes keys that could be used for operator injection ($ne, a.b, etc.) */
function stripDangerousKeys(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    stripDangerousKeys(obj[key], depth + 1);
  }
}

/**
 * Defense-in-depth NoSQL injection guard. Zod validation already strips unknown
 * fields, but this guarantees no `$`-prefixed or dotted keys reach Mongoose.
 */
export const sanitizeRequest = (req, res, next) => {
  stripDangerousKeys(req.body);
  stripDangerousKeys(req.params);
  next();
};

/**
 * Validates req.query against a zod schema. Express 5 makes req.query a
 * getter-only property, so the parsed/whitelisted value is exposed as
 * req.validatedQuery instead of overwriting req.query.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return next(new AppError(message || 'Invalid input', 422));
  }
  req.body = result.data;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return next(new AppError(message || 'Invalid query parameters', 422));
  }
  req.validatedQuery = result.data;
  next();
};
