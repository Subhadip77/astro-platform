const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { encrypt, decrypt } = require('../src/utils/crypto');
const { signToken, verifyToken } = require('../src/utils/jwt');
const { authorize } = require('../src/middleware/auth');

describe('Crypto Utility — AES-256-GCM', () => {
  it('encrypts and decrypts sensitive data correctly', () => {
    const sensitiveDob = '1995-06-15';
    const ciphertext = encrypt(sensitiveDob);

    assert.notEqual(ciphertext, sensitiveDob);
    assert(ciphertext.includes(':'));
    assert.strictEqual(ciphertext.split(':').length, 3);

    const decrypted = decrypt(ciphertext);
    assert.strictEqual(decrypted, sensitiveDob);
  });

  it('generates unique ciphertexts for identical inputs due to random IV', () => {
    const sensitiveTob = '10:30:00';
    const cipher1 = encrypt(sensitiveTob);
    const cipher2 = encrypt(sensitiveTob);

    assert.notEqual(cipher1, cipher2);
    assert.strictEqual(decrypt(cipher1), sensitiveTob);
    assert.strictEqual(decrypt(cipher2), sensitiveTob);
  });

  it('throws an error if ciphertext or authentication tag is tampered with', () => {
    const ciphertext = encrypt('secret_birth_details');
    const parts = ciphertext.split(':');
    // Tamper with the encrypted portion
    parts[2] = parts[2].substring(0, parts[2].length - 2) + 'aa';
    const tampered = parts.join(':');

    assert.throws(() => decrypt(tampered));
  });
});

describe('JWT Utility', () => {
  it('signs and verifies valid JWT tokens', () => {
    const payload = { id: 42, role: 'user', email: 'test@example.com' };
    const token = signToken(payload, { expiresIn: '1h' });

    assert.ok(token);
    assert.strictEqual(typeof token, 'string');

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id, 42);
    assert.strictEqual(decoded.role, 'user');
    assert.strictEqual(decoded.email, 'test@example.com');
  });

  it('rejects invalid or forged tokens', () => {
    assert.throws(() => verifyToken('invalid.jwt.token'));
  });
});

describe('Express App — Health & 404 Endpoints', () => {
  it('GET /api/v1/health returns 200 with service health info', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.services.database, 'connected');
    assert.ok(res.body.uptime_seconds >= 0);
  });

  it('returns 404 for unknown endpoints in JSON format', async () => {
    const res = await request(app).get('/api/v1/unknown-route-12345');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'NOT_FOUND');
  });

  it('includes security headers from helmet', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['x-frame-options'], 'SAMEORIGIN');
  });
});

describe('Express App — Auth Flow & Protection', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = null;
  let testUserId = null;

  it('rejects registration with invalid email or short password (Zod validation)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert(res.body.error.details.length >= 2);
  });

  it('successfully registers a new user with hashed password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.user.id);
    assert.strictEqual(res.body.data.user.email, testEmail);

    testUserId = res.body.data.user.id;
    authToken = res.body.data.token;
  });

  it('prevents duplicate user registration with same email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'EMAIL_ALREADY_EXISTS');
  });

  it('successfully logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testEmail);
    assert.strictEqual(res.body.data.user.password_hash, undefined);
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'WrongPassword99!' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  it('GET /api/v1/auth/me rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me returns user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, testEmail);
    assert.strictEqual(res.body.data.user.id, testUserId);
  });

  it('authorize middleware blocks non-admin users with 403 Forbidden', async () => {
    const middleware = authorize('admin');
    let calledNext = false;
    let statusCode = null;
    let responseData = null;

    const mockReq = { user: { role: 'user' } };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const mockNext = () => {
      calledNext = true;
    };

    middleware(mockReq, mockRes, mockNext);

    assert.strictEqual(calledNext, false);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(responseData.error.code, 'FORBIDDEN');
  });

  after(async () => {
    await db.closePool();
  });
});
