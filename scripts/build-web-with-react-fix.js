const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting web build with React global fix...');

  // Set environment variables from Netlify environment or defaults
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://trrsgvxoylhcudtiimvb.supabase.co';
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ';
  
  // Force use of Netlify environment variables if available
  if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('✅ Using Netlify environment variables');
  } else {
    console.log('⚠️ Using hardcoded fallback values');
  }
  
  console.log('🔧 Environment variables detected:');
  console.log('  From Netlify EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('  From Netlify EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  console.log('  Using SUPABASE_URL:', SUPABASE_URL);
  console.log('  Using SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  process.env.EXPO_PUBLIC_PLATFORM = 'web';
  process.env.EXPO_PUBLIC_DEV = 'true';
  process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  
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
            `EXPO_PUBLIC_DEV=true`,
            `EXPO_PUBLIC_PLATFORM=web`,
            `EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
            `EXPO_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}`,
            'npx expo export --platform web --clear'
          ].join(' ');
  
  execSync(exportCommand, { stdio: 'inherit' });

  // Fix React global
  console.log('🔧 Adding React global script...');
  const htmlPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Add React scripts and environment variables in the head
    const reactGlobalScript = `
<!-- React CDN Scripts -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

<script>
  // Set environment variables for runtime (from Netlify or hardcoded fallbacks)
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.EXPO_PUBLIC_PLATFORM = 'web';
  window.process.env.EXPO_PUBLIC_DEV = 'true';
  window.process.env.EXPO_PUBLIC_SUPABASE_URL = '${SUPABASE_URL}';
  window.process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
  
  // Also set them on the global process object for compatibility
  if (typeof process !== 'undefined') {
    process.env = process.env || {};
    process.env.EXPO_PUBLIC_PLATFORM = 'web';
    process.env.EXPO_PUBLIC_DEV = 'true';
    process.env.EXPO_PUBLIC_SUPABASE_URL = '${SUPABASE_URL}';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
  }
  
  // Set them directly on window for immediate access
  window.EXPO_PUBLIC_SUPABASE_URL = '${SUPABASE_URL}';
  window.EXPO_PUBLIC_SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
  window.EXPO_PUBLIC_PLATFORM = 'web';
  window.EXPO_PUBLIC_DEV = 'true';
  
  console.log('Environment variables set:', {
    EXPO_PUBLIC_PLATFORM: window.process.env.EXPO_PUBLIC_PLATFORM,
    EXPO_PUBLIC_DEV: window.process.env.EXPO_PUBLIC_DEV,
    EXPO_PUBLIC_SUPABASE_URL: window.process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: window.process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  });

  // Wait for React to be fully loaded before proceeding
  function waitForReact() {
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      console.log('React and ReactDOM loaded successfully');
      return true;
    }
    return false;
  }

  // Check if React is already loaded
  if (!waitForReact()) {
    // If not loaded, wait for it
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    const checkInterval = setInterval(() => {
      attempts++;
      if (waitForReact()) {
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('React failed to load within timeout');
      }
    }, 100);
  }

  // Add fallback error handling for React errors
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && (event.error.message.includes('Minified React error #130') || event.error.message.includes('Can\\'t find variable: React'))) {
      console.error('React error detected, showing fallback error page');
      document.body.innerHTML = \`
        <div style="padding: 24px; font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h1 style="color: #dc3545; margin-bottom: 8px;">Configuration Error</h1>
          <p style="color: #6c757d; margin-bottom: 24px;">De app mist verplichte environment variabelen.</p>
          
          <div style="margin-bottom: 24px; background: #ffffff; padding: 16px; border-radius: 8px;">
            <h2 style="color: #343a40; margin-bottom: 12px;">Ontbrekende variabelen:</h2>
            <div style="font-family: monospace; background: #f8f9fa; padding: 4px; border-radius: 4px; color: #e83e8c; margin: 2px 0;">EXPO_PUBLIC_SUPABASE_URL</div>
            <div style="font-family: monospace; background: #f8f9fa; padding: 4px; border-radius: 4px; color: #e83e8c; margin: 2px 0;">EXPO_PUBLIC_SUPABASE_ANON_KEY</div>
          </div>

          <div style="margin-bottom: 24px; background: #ffffff; padding: 16px; border-radius: 8px;">
            <h2 style="color: #343a40; margin-bottom: 12px;">Netlify deployment:</h2>
            <div style="font-size: 14px; color: #495057; margin-bottom: 8px; line-height: 20px;">1. Ga naar je Netlify site dashboard</div>
            <div style="font-size: 14px; color: #495057; margin-bottom: 8px; line-height: 20px;">2. Site settings → Build & deploy → Environment variables</div>
            <div style="font-size: 14px; color: #495057; margin-bottom: 8px; line-height: 20px;">3. Voeg de ontbrekende variabelen toe (met EXPO_PUBLIC_ prefix)</div>
            <div style="font-size: 14px; color: #495057; margin-bottom: 8px; line-height: 20px;">4. Clear cache and redeploy</div>
          </div>

          <div style="background: #fff3cd; border-color: #ffeaa7; border: 1px solid; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <div style="font-size: 14px; color: #856404; line-height: 20px;">
              ⚠️ Let op: Gebruik alleen publieke client-side variabelen. Server secrets (zoals SERVICE_ROLE_KEY) mogen nooit in client code.
            </div>
          </div>
        </div>
      \`;
    }
  });
</script>

<!-- Delay app execution until React is ready -->
<script>
  // Wait for DOM and React to be ready
  document.addEventListener('DOMContentLoaded', function() {
    function waitForReactAndStart() {
      if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
        console.log('React is ready, starting app...');
        // React is ready, app can start
      } else {
        console.log('Waiting for React...');
        setTimeout(waitForReactAndStart, 100);
      }
    }
    waitForReactAndStart();
  });
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
