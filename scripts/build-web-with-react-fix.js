const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting web build with React global fix...');

// Set environment variables
process.env.EXPO_PUBLIC_PLATFORM = 'web';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://trrsgvxoylhcudtiimvb.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnNndnhveWxoY3VkdGlpbXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQ3OTIsImV4cCI6MjA3MTc3MDc5Mn0.PG4cDu5UVUwE4Kp7NejdTcxdJDypkpdpQSO97Ipl8kQ';

try {
  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Run expo export
  console.log('📦 Running expo export...');
  execSync('npx expo export --platform web --clear', { stdio: 'inherit' });

  // Fix React global
  console.log('🔧 Adding React global script...');
  const htmlPath = path.join(__dirname, '../dist/index.html');
  
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Add React global script in the head
    const reactGlobalScript = `
<script>
  // Make React available globally by loading from CDN
  if (typeof window !== 'undefined' && !window.React) {
    // Load React from CDN
    const reactScript = document.createElement('script');
    reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
    reactScript.crossOrigin = 'anonymous';
    document.head.appendChild(reactScript);
    
    const reactDOMScript = document.createElement('script');
    reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
    reactDOMScript.crossOrigin = 'anonymous';
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
