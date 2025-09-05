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
    
    // Add React global script before the main script
    const reactGlobalScript = `
<script>
  // Make React available globally
  if (typeof window !== 'undefined') {
    window.React = require('react');
    window.ReactDOM = require('react-dom');
  }
</script>`;

    // Insert the script before the main script
    html = html.replace(
      '<script src="/_expo/static/js/web/index-',
      reactGlobalScript + '\n<script src="/_expo/static/js/web/index-'
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
