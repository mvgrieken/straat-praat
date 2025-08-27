import Constants from 'expo-constants';

/**
 * Helper to require environment variables and fail visibly if missing
 */
export function requireEnv(name: string): string {
  // First try Expo config extra
  const fromExpoConfig = Constants.expoConfig?.extra?.[name.replace('EXPO_PUBLIC_', '')];
  
  // Then try process.env
  const fromProcessEnv = process.env[name];
  
  const value = fromExpoConfig || fromProcessEnv;
  
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n\n` +
      `To fix this:\n` +
      `1. Add ${name} to your .env.local file\n` +
      `2. Or add it to app.json under "extra"\n` +
      `3. Or set it in your Netlify dashboard under "Environment variables"\n\n` +
      `Example:\n${name}=your_value_here`
    );
  }
  
  return value;
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