import { z } from 'zod';

// Environment variable candidates with EXPO_PUBLIC_ prefix (Expo SDK 49+)
const candidates = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  PLATFORM: process.env.EXPO_PUBLIC_PLATFORM,
  DEV: process.env.EXPO_PUBLIC_DEV,
  // Optional: Add other client-side environment variables as needed
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  AI_SERVICE_URL: process.env.EXPO_PUBLIC_AI_SERVICE_URL,
};

// Zod schema for validation
const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid HTTPS URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY cannot be empty'),
  PLATFORM: z.string().optional().default('web'),
  DEV: z.string().optional().default('false'),
  // Optional fields
  OPENAI_API_KEY: z.string().optional(),
  AI_SERVICE_URL: z.string().url().optional().or(z.literal('')),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv() {
  // Check for missing required variables
  const missing: string[] = [];
  const requiredKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
  
  requiredKeys.forEach((key) => {
    const value = candidates[key];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missing.push(`EXPO_PUBLIC_${key}`);
    }
  });

  // Parse and validate with Zod
  const parsed = envSchema.safeParse(candidates);

  return {
    ok: parsed.success && missing.length === 0,
    values: parsed.success ? parsed.data : null,
    missing,
    errors: parsed.success ? [] : parsed.error?.errors || [],
    message: parsed.success && missing.length === 0
      ? ''
      : `Environment validation failed. Missing: ${missing.join(', ')}. Errors: ${parsed.success ? 'none' : parsed.error?.errors.map(e => e.message).join(', ')}`,
  };
}

// Export validated environment variables for use throughout the app
export const env = (() => {
  const result = validateEnv();
  if (!result.ok) {
    throw new Error(`Environment validation failed: ${result.message}`);
  }
  return result.values!;
})();
