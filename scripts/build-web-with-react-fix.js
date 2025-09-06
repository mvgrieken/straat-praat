const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting web build with React global fix... v1.0.1');

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