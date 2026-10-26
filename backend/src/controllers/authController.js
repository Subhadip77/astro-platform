const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, phone, password, role = 'user' } = req.body;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either email or phone number is required to register.',
          },
        });
      }

      if (email) {
        const existingByEmail = await UserModel.findByEmail(email);
        if (existingByEmail) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'An account with this email address already exists.',
            },
          });
        }
      }

      if (phone) {
        const existingByPhone = await UserModel.findByPhone(phone);
        if (existingByPhone) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PHONE_ALREADY_EXISTS',
              message: 'An account with this phone number already exists.',
            },
          });
        }
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = await UserModel.create({
        email,
        phone,
        passwordHash,
        role,
        status: 'active',
      });

      const user = await UserModel.findById(userId);
      const token = signToken({
        id: user.id,
        role: user.role,
        email: user.email,
      });

      return res.status(201).json({
        success: true,
        message: 'Account successfully registered.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, phone, password } = req.body;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email or phone number is required.',
          },
        });
      }

      const user = email
        ? await UserModel.findByEmail(email)
        : await UserModel.findByPhone(phone);

      if (!user || !user.password_hash) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/phone or password.',
          },
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/phone or password.',
          },
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Your account is inactive or suspended. Please contact support.',
          },
        });
      }

      const token = signToken({
        id: user.id,
        role: user.role,
        email: user.email,
      });

      // Remove password_hash from response object
      delete user.password_hash;

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
}

module.exports = AuthController;
