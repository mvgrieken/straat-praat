import { z } from 'zod';

// Password validation schema with strong requirements
export const passwordSchema = z
  .string()
  .min(8, 'Wachtwoord moet minimaal 8 tekens bevatten')
  .max(128, 'Wachtwoord mag maximaal 128 tekens bevatten')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Wachtwoord moet minimaal 1 kleine letter, 1 hoofdletter en 1 cijfer bevatten');

// Email validation schema
export const emailSchema = z
  .string()
  .email('Voer een geldig e-mailadres in')
  .min(1, 'E-mailadres is verplicht')
  .max(320, 'E-mailadres is te lang')
  .transform((email) => email.toLowerCase().trim());

// Display name validation
export const displayNameSchema = z
  .string()
  .min(2, 'Naam moet minimaal 2 tekens bevatten')
  .max(50, 'Naam mag maximaal 50 tekens bevatten')
  .regex(/^[a-zA-Z\s\u00C0-\u017F]+$/, 
    'Naam mag alleen letters en spaties bevatten')
  .transform((name) => name.trim());

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Wachtwoord is verplicht'),
});

// Signup form schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Bevestig je wachtwoord'),
  displayName: displayNameSchema.optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Je moet de voorwaarden accepteren',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
});

// Password reset schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Update password schema
export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Bevestig je nieuwe wachtwoord'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
});

// PIN validation schema (4-6 digits)
export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, 'PIN moet 4-6 cijfers bevatten');

// Types for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type PinFormData = z.infer<typeof pinSchema>;