import { z } from 'zod';

// Function to get environment variables with multiple fallbacks
function getEnvVar(key: string): string | undefined {
  // 1. Try process.env first (build time)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // 2. Try window.EXPO_PUBLIC_* (runtime injection)
  if (typeof window !== 'undefined' && (window as any)[key]) {
    return (window as any)[key];
  }
  
  // 3. Try window.process.env (runtime injection)
  if (typeof window !== 'undefined' && window.process?.env && window.process.env[key]) {
    return window.process.env[key];
  }
  
  // 4. Hardcoded fallbacks for production
  const hardcodedValues: Record<string, string> = {
    'EXPO_PUBLIC_SUPABASE_URL': 'https://trrsgvxoylhcudtiimvb.supabase.co',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ',
    'EXPO_PUBLIC_PLATFORM': 'web',
    'EXPO_PUBLIC_DEV': 'true'
  };
  
  return hardcodedValues[key];
}

// Environment variable candidates with EXPO_PUBLIC_ prefix (Expo SDK 49+)
const candidates = {
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  PLATFORM: getEnvVar('EXPO_PUBLIC_PLATFORM'),
  DEV: getEnvVar('EXPO_PUBLIC_DEV'),
  // Optional: Add other client-side environment variables as needed
  OPENAI_API_KEY: getEnvVar('EXPO_PUBLIC_OPENAI_API_KEY'),
  AI_SERVICE_URL: getEnvVar('EXPO_PUBLIC_AI_SERVICE_URL'),
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
    errors: parsed.success ? [] : parsed.error?.issues?.map(issue => ({ message: issue.message })) || [],
    message: parsed.success && missing.length === 0
      ? ''
      : `Environment validation failed. Missing: ${missing.join(', ')}. Errors: ${parsed.success ? 'none' : parsed.error?.issues?.map(e => e.message).join(', ')}`,
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
