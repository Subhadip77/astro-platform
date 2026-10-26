const { z } = require('zod');

const SECRET_KEYS = new Set([
  'DB_PASSWORD',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'DATA_ENCRYPTION_KEY',
  'ASTROLOGY_API_API_KEY',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
]);

class ConfigValidationError extends Error {
  constructor(issues) {
    const formatted = issues.map((issue) => `- ${issue.field}: ${issue.message}`).join('\n');
    super(`Configuration validation failed:\n${formatted}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

function isPlaceholder(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('your_') || trimmed.includes('change_in_production');
}

function isValid32ByteKey(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();

  // 64 hexadecimal characters (32 bytes in hex)
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex').length === 32;
  }

  // Base64 encoding decoding to 32 bytes
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    try {
      const buf = Buffer.from(trimmed, 'base64');
      return buf.length === 32;
    } catch {
      return false;
    }
  }

  return false;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  NEXT_PUBLIC_APP_URL: z.string().min(1, 'Required').default('http://localhost:3000'),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1, 'Required').default('http://localhost:5000/api/v1'),

  DB_HOST: z.string().min(1, 'Required').default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1, 'Required').default('astro_platform'),
  DB_USER: z.string().min(1, 'Required').default('astro_user'),
  DB_PASSWORD: z.string().optional().default(''),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),

  REDIS_HOST: z.string().min(1, 'Required').default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_TTL_SECONDS: z.coerce.number().int().positive().default(86400),

  JWT_SECRET: z.string().min(8, 'Must be at least 8 characters long'),
  JWT_EXPIRES_IN: z.string().min(1, 'Required').default('7d'),

  DATA_ENCRYPTION_KEY: z.string().min(1, 'Required'),

  ASTROLOGY_API_USER_ID: z.string().min(1, 'Required'),
  ASTROLOGY_API_API_KEY: z.string().min(1, 'Required'),
  ASTROLOGY_API_BASE_URL: z.string().url('Must be a valid URL').default('https://json.astrologyapi.com/v1'),

  RAZORPAY_KEY_ID: z.string().min(1, 'Required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'Required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'Required'),

  SENDGRID_API_KEY: z.string().min(1, 'Required'),
  SENDGRID_FROM_EMAIL: z.string().email('Must be a valid email address').default('no-reply@astroplatform.com'),
  SENDGRID_FROM_NAME: z.string().min(1, 'Required').default('Astro Platform'),
});

function sanitizeZodIssues(issues) {
  return issues.map((issue) => {
    const field = issue.path.join('.') || 'configuration';
    let message = issue.message;

    if (issue.code === 'invalid_type') {
      message = `Expected ${issue.expected}, received ${issue.received}`;
    }

    if (
      SECRET_KEYS.has(field) ||
      field.toLowerCase().includes('secret') ||
      field.toLowerCase().includes('password') ||
      field.toLowerCase().includes('key')
    ) {
      // Strip any quoted or raw strings to prevent secret leakage
      message = message.replace(/'[^']*'/g, '[REDACTED]').replace(/"[^"]*"/g, '[REDACTED]');
    }

    return { field, message };
  });
}

function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

function getSafeConfigSummary(config) {
  return {
    environment: config.server ? config.server.nodeEnv : config.NODE_ENV,
    port: config.server ? config.server.port : config.PORT,
    client: {
      appUrl: config.client ? config.client.appUrl : config.NEXT_PUBLIC_APP_URL,
      apiBaseUrl: config.client ? config.client.apiBaseUrl : config.NEXT_PUBLIC_API_BASE_URL,
    },
    db: {
      host: config.db ? config.db.host : config.DB_HOST,
      port: config.db ? config.db.port : config.DB_PORT,
      name: config.db ? config.db.name : config.DB_NAME,
      user: config.db ? config.db.user : config.DB_USER,
      password: (config.db ? config.db.password : config.DB_PASSWORD) ? '********' : '[NOT SET]',
      connectionLimit: config.db ? config.db.connectionLimit : config.DB_CONNECTION_LIMIT,
    },
    redis: {
      host: config.redis ? config.redis.host : config.REDIS_HOST,
      port: config.redis ? config.redis.port : config.REDIS_PORT,
      password: (config.redis ? config.redis.password : config.REDIS_PASSWORD) ? '********' : '[NOT SET]',
      ttlSeconds: config.redis ? config.redis.ttlSeconds : config.REDIS_TTL_SECONDS,
    },
    auth: {
      jwtSecret: (config.auth ? config.auth.jwtSecret : config.JWT_SECRET) ? '********' : '[NOT SET]',
      jwtExpiresIn: config.auth ? config.auth.jwtExpiresIn : config.JWT_EXPIRES_IN,
    },
    crypto: {
      encryptionKey: (config.crypto ? config.crypto.encryptionKey : config.DATA_ENCRYPTION_KEY) ? '********' : '[NOT SET]',
    },
    astrologyApi: {
      baseUrl: config.astrologyApi ? config.astrologyApi.baseUrl : config.ASTROLOGY_API_BASE_URL,
      userId: config.astrologyApi ? config.astrologyApi.userId : config.ASTROLOGY_API_USER_ID,
      apiKey: (config.astrologyApi ? config.astrologyApi.apiKey : config.ASTROLOGY_API_API_KEY) ? '********' : '[NOT SET]',
    },
    payments: {
      razorpayKeyId: config.payments ? config.payments.razorpayKeyId : config.RAZORPAY_KEY_ID,
      razorpayKeySecret: (config.payments ? config.payments.razorpayKeySecret : config.RAZORPAY_KEY_SECRET) ? '********' : '[NOT SET]',
      razorpayWebhookSecret: (config.payments ? config.payments.razorpayWebhookSecret : config.RAZORPAY_WEBHOOK_SECRET) ? '********' : '[NOT SET]',
    },
    email: {
      fromEmail: config.email ? config.email.fromEmail : config.SENDGRID_FROM_EMAIL,
      fromName: config.email ? config.email.fromName : config.SENDGRID_FROM_NAME,
      sendgridApiKey: (config.email ? config.email.sendgridApiKey : config.SENDGRID_API_KEY) ? '********' : '[NOT SET]',
    },
  };
}

function loadConfig(env = process.env, options = {}) {
  const logger = options.logger || console;
  const parseResult = envSchema.safeParse(env);

  if (!parseResult.success) {
    const issues = sanitizeZodIssues(parseResult.error.issues);
    throw new ConfigValidationError(issues);
  }

  const parsed = parseResult.data;
  const isProd = parsed.NODE_ENV === 'production';
  const customIssues = [];

  // Check placeholders
  for (const [key, value] of Object.entries(parsed)) {
    if (isPlaceholder(value)) {
      if (isProd) {
        customIssues.push({
          field: key,
          message: 'Placeholder values are not permitted in production environment',
        });
      } else {
        logger.warn(`[CONFIG WARNING] Placeholder value detected for ${key}`);
      }
    }
  }

  // Validate DATA_ENCRYPTION_KEY 32-byte constraint
  const keyIsPlaceholder = isPlaceholder(parsed.DATA_ENCRYPTION_KEY);
  if (isProd || !keyIsPlaceholder) {
    if (!isValid32ByteKey(parsed.DATA_ENCRYPTION_KEY)) {
      customIssues.push({
        field: 'DATA_ENCRYPTION_KEY',
        message: 'Must be exactly 32 bytes (64 hexadecimal characters or 32-byte base64 encoded string)',
      });
    }
  }

  if (customIssues.length > 0) {
    throw new ConfigValidationError(customIssues);
  }

  const structuredConfig = {
    server: {
      port: parsed.PORT,
      nodeEnv: parsed.NODE_ENV,
      isProduction: isProd,
      isDevelopment: parsed.NODE_ENV === 'development',
      isTest: parsed.NODE_ENV === 'test',
    },
    client: {
      appUrl: parsed.NEXT_PUBLIC_APP_URL,
      apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL,
    },
    db: {
      host: parsed.DB_HOST,
      port: parsed.DB_PORT,
      name: parsed.DB_NAME,
      user: parsed.DB_USER,
      password: parsed.DB_PASSWORD,
      connectionLimit: parsed.DB_CONNECTION_LIMIT,
    },
    redis: {
      host: parsed.REDIS_HOST,
      port: parsed.REDIS_PORT,
      password: parsed.REDIS_PASSWORD,
      ttlSeconds: parsed.REDIS_TTL_SECONDS,
    },
    auth: {
      jwtSecret: parsed.JWT_SECRET,
      jwtExpiresIn: parsed.JWT_EXPIRES_IN,
    },
    crypto: {
      encryptionKey: parsed.DATA_ENCRYPTION_KEY,
    },
    astrologyApi: {
      baseUrl: parsed.ASTROLOGY_API_BASE_URL,
      userId: parsed.ASTROLOGY_API_USER_ID,
      apiKey: parsed.ASTROLOGY_API_API_KEY,
    },
    payments: {
      razorpayKeyId: parsed.RAZORPAY_KEY_ID,
      razorpayKeySecret: parsed.RAZORPAY_KEY_SECRET,
      razorpayWebhookSecret: parsed.RAZORPAY_WEBHOOK_SECRET,
    },
    email: {
      sendgridApiKey: parsed.SENDGRID_API_KEY,
      fromEmail: parsed.SENDGRID_FROM_EMAIL,
      fromName: parsed.SENDGRID_FROM_NAME,
    },
    raw: parsed,
  };

  return structuredConfig;
}

module.exports = {
  loadConfig,
  getSafeConfigSummary,
  deepFreeze,
  isValid32ByteKey,
  isPlaceholder,
  ConfigValidationError,
  SECRET_KEYS,
};
