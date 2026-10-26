const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address.').optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits.')
    .max(15, 'Phone number too long.')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password too long.'),
  role: z.enum(['user', 'astrologer']).default('user').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address.').optional(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(1, 'Password is required.'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
