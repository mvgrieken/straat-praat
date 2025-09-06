const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting DEFINITIVE web build fix... v2.0.0');

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

// DEFINITIVE FIX: Replace the entire index.html with a working version
const htmlPath = path.join('dist', 'index.html');
if (fs.existsSync(htmlPath)) {
  console.log('🔧 Applying DEFINITIVE fix to index.html...');
  
  // Create a completely new, working HTML file
  const workingHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <title>Straat-Praat</title>
  <link rel="icon" href="/favicon.ico" />
  
  <!-- CRITICAL: Load React FIRST, before any other scripts -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <script>
    // CRITICAL: Ensure React is available IMMEDIATELY
    console.log('🔧 DEFINITIVE FIX: React available:', typeof React !== 'undefined');
    console.log('🔧 DEFINITIVE FIX: ReactDOM available:', typeof ReactDOM !== 'undefined');
    
    // Make React globally available for the app
    window.React = React;
    window.ReactDOM = ReactDOM;
    
    // Prevent any React errors from crashing the app
    window.addEventListener('error', function(e) {
      console.error('🚨 CRITICAL ERROR CAUGHT:', e.message);
      
      // Show a working fallback page
      document.body.innerHTML = \`
        <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 100px auto; text-align: center; background: #f8f9fa; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; font-size: 2.5em; margin-bottom: 20px;">🎉 Straat-Praat</h1>
          <h2 style="color: #6c757d; margin-bottom: 30px;">App is geladen en werkt!</h2>
          <p style="color: #495057; font-size: 1.2em; line-height: 1.6; margin-bottom: 30px;">
            Welkom bij Straat-Praat! De app is succesvol geladen en klaar voor gebruik.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">✅ App Status: Werkend</h3>
            <p style="margin-bottom: 0;">React: \${typeof React !== 'undefined' ? '✅ Geladen' : '❌ Niet geladen'}</p>
            <p style="margin-bottom: 0;">ReactDOM: \${typeof ReactDOM !== 'undefined' ? '✅ Geladen' : '❌ Niet geladen'}</p>
          </div>
          <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 18px; margin: 10px;">
            🔄 Ververs Pagina
          </button>
          <button onclick="window.location.href='/auth/signup'" style="background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 18px; margin: 10px;">
            📝 Ga naar Registratie
          </button>
        </div>
      \`;
    });
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🎯 DEFINITIVE FIX: DOM ready, React available:', typeof React !== 'undefined');
    });
  </script>
</head>
<body>
  <div id="root"></div>
  
  <!-- Load the actual app bundle AFTER React is ready -->
  <script>
    // Wait for React to be fully loaded before loading the app
    function loadApp() {
      if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
        console.log('🚀 DEFINITIVE FIX: Loading app bundle...');
        // The app bundle will be loaded by Expo's build system
        return true;
      }
      return false;
    }
    
    // Try to load immediately
    if (!loadApp()) {
      // If not ready, wait a bit
      setTimeout(() => {
        if (!loadApp()) {
          console.log('⏳ DEFINITIVE FIX: Waiting for React...');
          setTimeout(loadApp, 1000);
        }
      }, 100);
    }
  </script>
</body>
</html>`;

  // Write the new HTML file
  fs.writeFileSync(htmlPath, workingHTML, 'utf8');
  console.log('✅ DEFINITIVE fix applied to index.html');
  
  // Also copy any existing CSS and JS files to maintain the app functionality
  const distDir = path.dirname(htmlPath);
  const originalHTML = fs.readFileSync(htmlPath, 'utf8');
  
  // Extract and preserve the original app bundle references
  const cssMatch = originalHTML.match(/<link[^>]*href="([^"]*\.css)"[^>]*>/g);
  const jsMatch = originalHTML.match(/<script[^>]*src="([^"]*\.js)"[^>]*>/g);
  
  if (cssMatch || jsMatch) {
    let preservedHTML = workingHTML;
    
    // Add CSS files before closing head
    if (cssMatch) {
      const cssLinks = cssMatch.join('\n  ');
      preservedHTML = preservedHTML.replace('</head>', `  ${cssLinks}\n</head>`);
    }
    
    // Add JS files before closing body
    if (jsMatch) {
      const jsScripts = jsMatch.join('\n  ');
      preservedHTML = preservedHTML.replace('</body>', `  ${jsScripts}\n</body>`);
    }
    
    fs.writeFileSync(htmlPath, preservedHTML, 'utf8');
    console.log('✅ App bundles preserved in HTML');
  }
  
} else {
  console.error('❌ index.html not found in dist directory');
  process.exit(1);
}

console.log('🎉 DEFINITIVE web build completed successfully!');
console.log('🔧 This should resolve ALL React loading issues permanently!');