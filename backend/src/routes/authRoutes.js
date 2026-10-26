const express = require('express');
const AuthController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validateRequest({ body: registerSchema }),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login
);

router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
