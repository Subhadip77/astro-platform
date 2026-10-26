const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  loadConfig,
  getSafeConfigSummary,
  deepFreeze,
  isValid32ByteKey,
  isPlaceholder,
  ConfigValidationError,
  SECRET_KEYS,
} = require('../src/config/loadConfig');

// Helper to create a valid baseline test environment
function createValidEnv(overrides = {}) {
  // Generate a valid 32-byte hex key for tests
  const validHexKey = crypto.randomBytes(32).toString('hex');

  return {
    NODE_ENV: 'test',
    PORT: '5000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5000/api/v1',
    DB_HOST: '127.0.0.1',
    DB_PORT: '3306',
    DB_NAME: 'astro_platform_test',
    DB_USER: 'test_user',
    DB_PASSWORD: 'test_password',
    DB_CONNECTION_LIMIT: '5',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: 'redis_secret_pass',
    REDIS_TTL_SECONDS: '3600',
    JWT_SECRET: 'super_secret_jwt_key_test_123',
    JWT_EXPIRES_IN: '1d',
    DATA_ENCRYPTION_KEY: validHexKey,
    ASTROLOGY_API_USER_ID: 'astro_test_user',
    ASTROLOGY_API_API_KEY: 'astro_test_api_key_xyz',
    ASTROLOGY_API_BASE_URL: 'https://json.astrologyapi.com/v1',
    RAZORPAY_KEY_ID: 'rzp_test_12345',
    RAZORPAY_KEY_SECRET: 'rzp_secret_secret99',
    RAZORPAY_WEBHOOK_SECRET: 'rzp_webhook_secret_abc',
    SENDGRID_API_KEY: 'SG.test_key_random_value',
    SENDGRID_FROM_EMAIL: 'no-reply@astroplatform.com',
    SENDGRID_FROM_NAME: 'Astro Platform Test',
    ...overrides,
  };
}

describe('Config Loader — loadConfig pure function', () => {
  it('successfully parses and validates a complete valid environment', () => {
    const env = createValidEnv();
    const config = loadConfig(env);

    assert.equal(config.server.port, 5000);
    assert.equal(config.server.nodeEnv, 'test');
    assert.equal(config.server.isTest, true);
    assert.equal(config.server.isProduction, false);
    assert.equal(config.db.port, 3306);
    assert.equal(config.db.name, 'astro_platform_test');
    assert.equal(config.redis.ttlSeconds, 3600);
    assert.equal(config.auth.jwtSecret, 'super_secret_jwt_key_test_123');
    assert.equal(config.crypto.encryptionKey, env.DATA_ENCRYPTION_KEY);
  });

  it('coerces string numbers into valid integers', () => {
    const env = createValidEnv({
      PORT: '8080',
      DB_PORT: '3307',
      REDIS_PORT: '6380',
      DB_CONNECTION_LIMIT: '20',
      REDIS_TTL_SECONDS: '7200',
    });
    const config = loadConfig(env);

    assert.strictEqual(config.server.port, 8080);
    assert.strictEqual(config.db.port, 3307);
    assert.strictEqual(config.redis.port, 6380);
    assert.strictEqual(config.db.connectionLimit, 20);
    assert.strictEqual(config.redis.ttlSeconds, 7200);
  });

  it('fails fast when required fields are missing', () => {
    const env = createValidEnv();
    delete env.JWT_SECRET;
    delete env.ASTROLOGY_API_API_KEY;

    assert.throws(
      () => loadConfig(env),
      (err) => {
        assert(err instanceof ConfigValidationError);
        assert(err.message.includes('JWT_SECRET'));
        assert(err.message.includes('ASTROLOGY_API_API_KEY'));
        return true;
      }
    );
  });

  it('fails fast on invalid port types', () => {
    const env = createValidEnv({ PORT: 'not-a-number' });

    assert.throws(
      () => loadConfig(env),
      (err) => {
        assert(err instanceof ConfigValidationError);
        assert(err.message.includes('PORT'));
        return true;
      }
    );
  });

  it('NEVER prints secret values in error messages', () => {
    const superSecretPass = 'my_super_confidential_secret_password_99999!';
    const env = createValidEnv({
      JWT_SECRET: 'short', // Too short (must be at least 8 chars)
      DB_PASSWORD: superSecretPass,
      PORT: 'invalid_port',
    });

    try {
      loadConfig(env);
      assert.fail('Should have thrown ConfigValidationError');
    } catch (err) {
      assert(err instanceof ConfigValidationError);
      // Ensure the secret password does NOT appear anywhere in the error message
      assert.strictEqual(err.message.includes(superSecretPass), false);
      // Ensure JWT_SECRET error doesn't echo the short secret either
      assert.strictEqual(err.message.includes('short'), false);
    }
  });
});

describe('Placeholder Detection', () => {
  it('warns on placeholder values in development mode without throwing', () => {
    const warnings = [];
    const mockLogger = {
      warn: (msg) => warnings.push(msg),
      log: () => {},
      error: () => {},
    };

    const env = createValidEnv({
      NODE_ENV: 'development',
      RAZORPAY_KEY_ID: 'your_razorpay_key_id',
      DATA_ENCRYPTION_KEY: 'your_32_byte_hex_or_base64_encryption_key',
    });

    const config = loadConfig(env, { logger: mockLogger });
    assert.ok(config);
    assert.strictEqual(config.server.isDevelopment, true);
    assert(warnings.some((w) => w.includes('RAZORPAY_KEY_ID')));
    assert(warnings.some((w) => w.includes('DATA_ENCRYPTION_KEY')));
  });

  it('rejects placeholder values strictly in production mode', () => {
    const env = createValidEnv({
      NODE_ENV: 'production',
      RAZORPAY_KEY_ID: 'your_razorpay_key_id',
    });

    assert.throws(
      () => loadConfig(env),
      (err) => {
        assert(err instanceof ConfigValidationError);
        assert(err.message.includes('RAZORPAY_KEY_ID'));
        assert(err.message.includes('production'));
        return true;
      }
    );
  });
});

describe('DATA_ENCRYPTION_KEY 32-Byte Constraint', () => {
  it('accepts 64-hex character string (32 bytes)', () => {
    const hex32Bytes = crypto.randomBytes(32).toString('hex');
    assert.strictEqual(hex32Bytes.length, 64);

    const env = createValidEnv({ DATA_ENCRYPTION_KEY: hex32Bytes });
    const config = loadConfig(env);
    assert.strictEqual(config.crypto.encryptionKey, hex32Bytes);
  });

  it('accepts 32-byte base64 encoded string', () => {
    const base6432Bytes = crypto.randomBytes(32).toString('base64');
    const env = createValidEnv({ DATA_ENCRYPTION_KEY: base6432Bytes });
    const config = loadConfig(env);
    assert.strictEqual(config.crypto.encryptionKey, base6432Bytes);
  });

  it('rejects invalid key length (e.g., 16 bytes hex)', () => {
    const hex16Bytes = crypto.randomBytes(16).toString('hex');
    const env = createValidEnv({
      NODE_ENV: 'production',
      DATA_ENCRYPTION_KEY: hex16Bytes,
    });

    assert.throws(
      () => loadConfig(env),
      (err) => {
        assert(err instanceof ConfigValidationError);
        assert(err.message.includes('DATA_ENCRYPTION_KEY'));
        assert(err.message.includes('32 bytes'));
        return true;
      }
    );
  });

  it('rejects invalid key encoding', () => {
    const invalidKey = 'not_a_hex_or_base64_key_at_all!!@@##$$%%^^';
    const env = createValidEnv({
      NODE_ENV: 'production',
      DATA_ENCRYPTION_KEY: invalidKey,
    });

    assert.throws(
      () => loadConfig(env),
      (err) => {
        assert(err instanceof ConfigValidationError);
        assert(err.message.includes('DATA_ENCRYPTION_KEY'));
        return true;
      }
    );
  });
});

describe('Config Immutability & Deep Freeze', () => {
  it('deepFreeze prevents modifications to nested properties', () => {
    const env = createValidEnv();
    const config = deepFreeze(loadConfig(env));

    assert.strictEqual(Object.isFrozen(config), true);
    assert.strictEqual(Object.isFrozen(config.server), true);
    assert.strictEqual(Object.isFrozen(config.db), true);
    assert.strictEqual(Object.isFrozen(config.crypto), true);

    // Attempting to modify should fail or throw in strict mode
    assert.throws(() => {
      'use strict';
      config.server.port = 9999;
    }, TypeError);

    assert.throws(() => {
      'use strict';
      config.db.host = 'attacker.com';
    }, TypeError);
  });
});

describe('Safe Config Summary', () => {
  it('masks all secrets and leaves non-sensitive data visible', () => {
    const env = createValidEnv({
      JWT_SECRET: 'super_secret_jwt_string_to_mask',
      DB_PASSWORD: 'super_secret_db_pass',
      REDIS_PASSWORD: 'super_secret_redis_pass',
      ASTROLOGY_API_API_KEY: 'astro_api_key_secret',
      RAZORPAY_KEY_SECRET: 'rzp_key_secret_mask',
      RAZORPAY_WEBHOOK_SECRET: 'rzp_webhook_mask',
      SENDGRID_API_KEY: 'sendgrid_secret_mask',
    });

    const config = loadConfig(env);
    const summary = getSafeConfigSummary(config);

    // Verify secrets are masked
    assert.strictEqual(summary.auth.jwtSecret, '********');
    assert.strictEqual(summary.db.password, '********');
    assert.strictEqual(summary.redis.password, '********');
    assert.strictEqual(summary.crypto.encryptionKey, '********');
    assert.strictEqual(summary.astrologyApi.apiKey, '********');
    assert.strictEqual(summary.payments.razorpayKeySecret, '********');
    assert.strictEqual(summary.payments.razorpayWebhookSecret, '********');
    assert.strictEqual(summary.email.sendgridApiKey, '********');

    // Verify non-secrets are visible
    assert.strictEqual(summary.port, 5000);
    assert.strictEqual(summary.environment, 'test');
    assert.strictEqual(summary.db.host, '127.0.0.1');
    assert.strictEqual(summary.db.name, 'astro_platform_test');
    assert.strictEqual(summary.payments.razorpayKeyId, 'rzp_test_12345');
    assert.strictEqual(summary.astrologyApi.userId, 'astro_test_user');

    // Verify that the serialized summary JSON does not contain any secret string
    const serialized = JSON.stringify(summary);
    assert.strictEqual(serialized.includes('super_secret_jwt_string_to_mask'), false);
    assert.strictEqual(serialized.includes('super_secret_db_pass'), false);
    assert.strictEqual(serialized.includes('super_secret_redis_pass'), false);
    assert.strictEqual(serialized.includes('astro_api_key_secret'), false);
    assert.strictEqual(serialized.includes('rzp_key_secret_mask'), false);
    assert.strictEqual(serialized.includes('sendgrid_secret_mask'), false);
  });
});

describe('Config Index Module', () => {
  it('exports frozen config, helper functions, and custom error class', () => {
    // Setup process.env for index.js
    const validEnv = createValidEnv();
    for (const [k, v] of Object.entries(validEnv)) {
      process.env[k] = v;
    }

    const indexConfig = require('../src/config/index');
    assert.strictEqual(Object.isFrozen(indexConfig), true);
    assert.strictEqual(Object.isFrozen(indexConfig.server), true);
    assert.strictEqual(typeof indexConfig.loadConfig, 'function');
    assert.strictEqual(typeof indexConfig.getSafeConfigSummary, 'function');
    assert.strictEqual(typeof indexConfig.deepFreeze, 'function');
    assert.strictEqual(indexConfig.ConfigValidationError, ConfigValidationError);
  });
});

