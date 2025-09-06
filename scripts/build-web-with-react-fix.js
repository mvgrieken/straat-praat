const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting web build with React global fix... v1.0.2');

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
  console.log('🧹 Cleaned dist directory');
}

// Run expo export
console.log('📦 Running expo export...');
try {
  execSync('npx expo export --platform web --clear --no-minify', { stdio: 'inherit' });
  console.log('✅ Expo export completed');
} catch (error) {
  console.error('❌ Expo export failed:', error.message);
  process.exit(1);
}

// Add React scripts to index.html
const htmlPath = path.join('dist', 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Add React scripts - no environment variables needed
  const reactGlobalScript = `
<!-- React CDN Scripts - Load synchronously -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

<script>
  // Global error handler for React errors
  window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.message, e.filename, e.lineno);
    
    if (e.message.includes('Minified React error #130') || 
        e.message.includes('Can\\'t find variable: React') ||
        e.message.includes('React is not defined')) {
      
      console.error('React Error #130 detected - showing fallback page');
      document.body.innerHTML = \`
        <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
          <h1 style="color: #e74c3c;">🚨 App Configuration Error</h1>
          <p style="color: #666; line-height: 1.6; margin: 20px 0;">
            Er is een technisch probleem opgetreden. De app kan niet correct worden geladen.
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left;">
            <strong>Mogelijke oplossingen:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Ververs de pagina (F5 of Ctrl+R)</li>
              <li>Wis de browser cache</li>
              <li>Probeer een andere browser</li>
              <li>Controleer je internetverbinding</li>
            </ul>
          </div>
          <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🔄 Pagina Verversen
          </button>
        </div>
      \`;
    }
  });
  
  // Verify React is loaded immediately
  console.log('React loaded:', typeof React !== 'undefined');
  console.log('ReactDOM loaded:', typeof ReactDOM !== 'undefined');
  
  // Wait for React to be fully loaded before proceeding
  function waitForReact() {
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      console.log('✅ React and ReactDOM loaded successfully');
      return true;
    }
    return false;
  }

  // Check if React is already loaded
  if (!waitForReact()) {
    // If not loaded, wait for it
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max wait
    const checkInterval = setInterval(() => {
      attempts++;
      if (waitForReact()) {
        clearInterval(checkInterval);
        console.log('✅ React loading completed');
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('❌ React failed to load within timeout');
        // Show fallback page if React fails to load
        document.body.innerHTML = \`
          <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h1 style="color: #e74c3c;">🚨 React Loading Error</h1>
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              React kon niet worden geladen. Dit kan een netwerkprobleem zijn.
            </p>
            <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px;">
              🔄 Opnieuw Proberen
            </button>
          </div>
        \`;
      } else {
        console.log('⏳ Waiting for React... attempt', attempts);
      }
    }, 100);
  }

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded');
    // DOM is ready, React should be available
  });
</script>`;

  // Insert React scripts before closing head tag
  html = html.replace('</head>', `${reactGlobalScript}\n</head>`);
  
  // Write modified HTML
  fs.writeFileSync(htmlPath, html);
  console.log('✅ React global script added to index.html');
} else {
  console.error('❌ index.html not found in dist directory');
  process.exit(1);
}

console.log('🎉 Web build completed successfully!');