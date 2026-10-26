const crypto = require('node:crypto');
const { config } = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16;

function getKeyBuffer() {
  const rawKey = config.crypto.encryptionKey;
  if (!rawKey) {
    throw new Error('Encryption key not configured in environment (DATA_ENCRYPTION_KEY).');
  }

  const trimmed = rawKey.trim();

  // 64 hex characters
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // Base64 decoding to 32 bytes
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    const buf = Buffer.from(trimmed, 'base64');
    if (buf.length === 32) return buf;
  }

  // Fallback: SHA-256 hash to guarantee 32 bytes in development/placeholder mode
  return crypto.createHash('sha256').update(trimmed).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: "iv:authTag:encryptedText" (hex encoded)
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }

  const textToEncrypt = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext encrypted with encrypt().
 */
function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') {
    return ciphertext;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  getKeyBuffer,
};
