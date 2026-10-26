const jwt = require('jsonwebtoken');
const { config } = require('../config');

function signToken(payload, options = {}) {
  const secret = config.auth.jwtSecret;
  const expiresIn = options.expiresIn || config.auth.jwtExpiresIn || '7d';

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'astro-platform-api',
    ...options,
  });
}

function verifyToken(token) {
  const secret = config.auth.jwtSecret;
  return jwt.verify(token, secret, {
    issuer: 'astro-platform-api',
  });
}

module.exports = {
  signToken,
  verifyToken,
};
