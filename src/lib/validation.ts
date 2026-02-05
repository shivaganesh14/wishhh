import { z } from 'zod';

// Sanitize text input to prevent XSS
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate UUID format
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Capsule creation validation schema
export const createCapsuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .refine((val) => !/<script/i.test(val), 'Invalid characters in title'),
  content: z
    .string()
    .max(10000, 'Content must be less than 10,000 characters')
    .optional()
    .nullable(),
  recipientEmail: z
    .string()
    .email('Please enter a valid email')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  unlockDate: z.date({
    required_error: 'Unlock date is required',
  }),
  unlockTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
});

// Password verification validation
export const passwordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long'),
});

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters'),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type CreateCapsuleInput = z.infer<typeof createCapsuleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
