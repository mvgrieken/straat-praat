import Constants from 'expo-constants';

/**
 * Helper to require environment variables and fail visibly if missing
 */
export function requireEnv(name: string): string {
  // Allow multiple ways to provide config via Expo extras or process.env
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;
  const withoutPrefix = name.replace('EXPO_PUBLIC_', ''); // e.g. SUPABASE_URL

  // Convert SUPABASE_ANON_KEY -> supabaseAnonKey
  const toCamel = (key: string) =>
    key
      .toLowerCase()
      .split('_')
      .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join('');

  const camelKey = toCamel(withoutPrefix);

  // Then try process.env and different extra shapes
  const fromProcessEnv = process.env[name];
  const fromWindowProcess = typeof window !== 'undefined' && window.process?.env?.[name];
  const fromExpoCamel = extra[camelKey];
  const fromExpoUpper = extra[withoutPrefix];
  const fromExpoExact = extra[name];

  // Hardcoded fallbacks for production
  const hardcodedValues: Record<string, string> = {
    'EXPO_PUBLIC_SUPABASE_URL': 'https://trrsgvxoylhcudtiimvb.supabase.co',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ',
    'EXPO_PUBLIC_PLATFORM': 'web',
    'EXPO_PUBLIC_DEV': 'true'
  };

  const value = fromExpoCamel || fromExpoUpper || fromExpoExact || fromProcessEnv || fromWindowProcess || hardcodedValues[name];

  if (!value) {
    console.error('Environment variable lookup failed:', {
      name,
      withoutPrefix,
      camelKey,
      fromProcessEnv: !!fromProcessEnv,
      fromWindowProcess: !!fromWindowProcess,
      fromExpoCamel: !!fromExpoCamel,
      fromExpoUpper: !!fromExpoUpper,
      fromExpoExact: !!fromExpoExact,
      extra: Object.keys(extra),
      processEnv: typeof process !== 'undefined' ? Object.keys(process.env || {}) : 'undefined',
      windowProcess: typeof window !== 'undefined' && window.process?.env ? Object.keys(window.process.env) : 'undefined'
    });
    
    throw new Error(
      `Missing required environment variable: ${name}\n\n` +
        `To fix this:\n` +
        `1. Add ${name} to your .env.local file\n` +
        `2. Or add it to app.json under "extra" (as ${withoutPrefix} or ${camelKey})\n` +
        `3. Or set it in your Netlify dashboard under "Environment variables"\n\n` +
        `Example:\n${name}=your_value_here`
    );
  }

  return value as string;
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): { supabaseUrl: string; supabaseAnonKey: string } {
  try {
    const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL');
    const supabaseAnonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    
    // Basic validation
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
    }
    
    if (supabaseAnonKey.length < 100) {
      throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
    }
    
    return { supabaseUrl, supabaseAnonKey };
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}
