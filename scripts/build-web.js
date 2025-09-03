#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Straat-Praat for Web...');

// Backup original files
const originalPackagePath = path.join(__dirname, '..', 'package.json');
const backupPackagePath = path.join(__dirname, '..', 'package.json.backup');
const webPackagePath = path.join(__dirname, '..', 'package.web.json');

const originalAppPath = path.join(__dirname, '..', 'app.json');
const backupAppPath = path.join(__dirname, '..', 'app.json.backup');
const webAppPath = path.join(__dirname, '..', 'app.web.json');

const originalLayoutPath = path.join(__dirname, '..', 'app', '_layout.tsx');
const backupLayoutPath = path.join(__dirname, '..', 'app', '_layout.tsx.backup');
const webLayoutPath = path.join(__dirname, '..', 'app', '_layout.web.tsx');

try {
  // Backup original files
  fs.copyFileSync(originalPackagePath, backupPackagePath);
  fs.copyFileSync(originalAppPath, backupAppPath);
  fs.copyFileSync(originalLayoutPath, backupLayoutPath);
  console.log('✅ Backed up original files');

  // Copy web-specific files
  fs.copyFileSync(webPackagePath, originalPackagePath);
  fs.copyFileSync(webAppPath, originalAppPath);
  fs.copyFileSync(webLayoutPath, originalLayoutPath);
  console.log('✅ Switched to web-specific configuration');

  // Install web dependencies
  console.log('📦 Installing web dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build web version
  console.log('🔨 Building web version...');
  execSync('npx expo export --platform web --clear', { stdio: 'inherit' });

  console.log('✅ Web build completed successfully!');
  console.log('📁 Output directory: web-build/');

} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Restore original files
  try {
    fs.copyFileSync(backupPackagePath, originalPackagePath);
    fs.copyFileSync(backupAppPath, originalAppPath);
    fs.copyFileSync(backupLayoutPath, originalLayoutPath);
    console.log('✅ Restored original files');
    
    // Reinstall original dependencies
    console.log('📦 Reinstalling original dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  } catch (restoreError) {
    console.error('❌ Failed to restore files:', restoreError.message);
  }
}