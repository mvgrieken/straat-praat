const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting web build with React global fix...');

  // Set environment variables
  process.env.EXPO_PUBLIC_PLATFORM = 'web';
  process.env.EXPO_PUBLIC_DEV = 'true';
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://trrsgvxoylhcudtiimvb.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ';
  
  console.log('🔧 Environment variables set:');
  console.log('  EXPO_PUBLIC_PLATFORM:', process.env.EXPO_PUBLIC_PLATFORM);
  console.log('  EXPO_PUBLIC_DEV:', process.env.EXPO_PUBLIC_DEV);
  console.log('  EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

try {
  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Run expo export in development mode for better error messages
  console.log('📦 Running expo export in development mode...');
  const exportCommand = [
    'NODE_ENV=development',
    'EXPO_PUBLIC_DEV=true',
    'EXPO_PUBLIC_PLATFORM=web',
    'EXPO_PUBLIC_SUPABASE_URL=https://trrsgvxoylhcudtiimvb.supabase.co',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ',
    'npx expo export --platform web --clear'
  ].join(' ');
  
  execSync(exportCommand, { stdio: 'inherit' });

  // Fix React global
  console.log('🔧 Adding React global script...');
  const htmlPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Add React global script and environment variables in the head
    const reactGlobalScript = `
<script>
  // Set environment variables for runtime
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.EXPO_PUBLIC_PLATFORM = 'web';
  window.process.env.EXPO_PUBLIC_DEV = 'true';
  window.process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://trrsgvxoylhcudtiimvb.supabase.co';
  window.process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ';
  
  console.log('Environment variables set:', {
    EXPO_PUBLIC_PLATFORM: window.process.env.EXPO_PUBLIC_PLATFORM,
    EXPO_PUBLIC_DEV: window.process.env.EXPO_PUBLIC_DEV,
    EXPO_PUBLIC_SUPABASE_URL: window.process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: window.process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  });

  // Make React available globally by loading from CDN
  if (typeof window !== 'undefined' && !window.React) {
    // Load React from CDN (development version for better errors)
    const reactScript = document.createElement('script');
    reactScript.src = 'https://unpkg.com/react@18/umd/react.development.js';
    reactScript.crossOrigin = 'anonymous';
    reactScript.onload = function() {
      console.log('React loaded successfully');
    };
    reactScript.onerror = function() {
      console.error('Failed to load React from CDN');
    };
    document.head.appendChild(reactScript);
    
    const reactDOMScript = document.createElement('script');
    reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.development.js';
    reactDOMScript.crossOrigin = 'anonymous';
    reactDOMScript.onload = function() {
      console.log('ReactDOM loaded successfully');
    };
    reactDOMScript.onerror = function() {
      console.error('Failed to load ReactDOM from CDN');
    };
    document.head.appendChild(reactDOMScript);
  }
</script>`;

    // Insert the script in the head section
    html = html.replace(
      '</head>',
      reactGlobalScript + '\n</head>'
    );

    // Write the modified HTML back
    fs.writeFileSync(htmlPath, html);
    console.log('✅ React global script added to index.html');
  } else {
    console.log('❌ index.html not found');
  }

  console.log('🎉 Web build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
