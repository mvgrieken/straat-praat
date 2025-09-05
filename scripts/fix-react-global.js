const fs = require('fs');
const path = require('path');

// Read the generated HTML file
const htmlPath = path.join(__dirname, '../dist/index.html');
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
