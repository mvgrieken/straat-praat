const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting web build...');

try {
  // Create dist directory if it doesn't exist
  const distDir = path.join(__dirname, '..', 'dist-web');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Try to build with expo export
  console.log('📦 Building with Expo export...');
  execSync('npx expo export --platform web --output-dir dist-web', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Web build completed successfully!');
  console.log(`📁 Output directory: ${distDir}`);
} catch (error) {
  console.error('❌ Expo export failed, trying alternative build...');
  
  try {
    // Fallback: create a simple static build
    const publicDir = path.join(__dirname, '..', 'public');
    const distDir = path.join(__dirname, '..', 'dist-web');
    
    if (fs.existsSync(publicDir)) {
      // Copy public files
      execSync(`xcopy "${publicDir}" "${distDir}" /E /I /Y`, { stdio: 'inherit' });
    }
    
    // Create a simple index.html if it doesn't exist
    const indexPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Straat-Praat</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Straat-Praat</h1>
        <p>Een app voor ouders om jongerenslang te leren</p>
        <p>Web versie wordt momenteel ontwikkeld...</p>
    </div>
</body>
</html>`;
      fs.writeFileSync(indexPath, htmlContent);
    }
    
    console.log('✅ Fallback web build completed!');
    console.log(`📁 Output directory: ${distDir}`);
  } catch (fallbackError) {
    console.error('❌ Build failed:', fallbackError.message);
    process.exit(1);
  }
}