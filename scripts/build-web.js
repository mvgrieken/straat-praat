const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy index.html from public to dist
const sourceFile = path.join(__dirname, '..', 'public', 'index.html');
const destFile = path.join(distDir, 'index.html');

try {
  const content = fs.readFileSync(sourceFile, 'utf8');
  fs.writeFileSync(destFile, content);
  console.log('✅ Successfully built static site to dist/');
  console.log(`📄 Generated: ${destFile}`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}