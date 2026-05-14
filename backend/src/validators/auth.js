const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6).max(100),
  phone: z.string().optional(),
  referral_code: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

module.exports = { registerSchema, loginSchema, adminLoginSchema };
