#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Building Simple Straat-Praat Web Version...');

// Create web-build directory
const webBuildDir = path.join(__dirname, '..', 'web-build');
if (!fs.existsSync(webBuildDir)) {
  fs.mkdirSync(webBuildDir, { recursive: true });
}

// Create a simple index.html
const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Straat-Praat</title>
    <meta name="description" content="Een app voor ouders om jongerenslang te leren">
    <link rel="icon" href="/favicon.ico" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .title {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .feature-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .feature-desc {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .cta {
            margin-top: 2rem;
        }
        
        .cta-button {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 1rem 2rem;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .cta-button:hover {
            background: rgba(255,255,255,0.3);
            border-color: rgba(255,255,255,0.5);
            transform: translateY(-2px);
        }
        
        .status {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .status-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .status-text {
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .title {
                font-size: 2rem;
            }
            
            .features {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1 class="title">Straat-Praat</h1>
        <p class="subtitle">
            Een innovatieve app voor ouders om jongerenslang te leren en de communicatie met hun kinderen te verbeteren
        </p>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">📚</div>
                <div class="feature-title">Woordenboek</div>
                <div class="feature-desc">Uitgebreide database van jongerenslang en straattaal</div>
            </div>
            <div class="feature">
                <div class="feature-icon">🎯</div>
                <div class="feature-title">Quiz Systeem</div>
                <div class="feature-desc">Leer door interactieve quizzen en uitdagingen</div>
            </div>
            <div class="feature">
                <div class="feature-icon">🌐</div>
                <div class="feature-title">Vertalingen</div>
                <div class="feature-desc">AI-ondersteunde vertalingen en uitleg</div>
            </div>
        </div>
        
        <div class="cta">
            <a href="#" class="cta-button">Download de App</a>
        </div>
        
        <div class="status">
            <div class="status-title">🔄 Status</div>
            <div class="status-text">
                Web versie wordt momenteel ontwikkeld. De mobiele app is beschikbaar voor iOS en Android.
            </div>
        </div>
    </div>
    
    <script>
        // Simple interaction
        document.querySelector('.cta-button').addEventListener('click', function(e) {
            e.preventDefault();
            alert('De app is beschikbaar in de App Store en Google Play Store!');
        });
        
        // Add some animation
        const features = document.querySelectorAll('.feature');
        features.forEach((feature, index) => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                feature.style.transition = 'all 0.6s ease';
                feature.style.opacity = '1';
                feature.style.transform = 'translateY(0)';
            }, index * 200);
        });
    </script>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(webBuildDir, 'index.html'), htmlContent);

// Copy favicon if it exists
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
if (fs.existsSync(faviconPath)) {
  fs.copyFileSync(faviconPath, path.join(webBuildDir, 'favicon.ico'));
}

// Create _redirects file for Netlify
const redirectsContent = `/*    /index.html   200`;
fs.writeFileSync(path.join(webBuildDir, '_redirects'), redirectsContent);

console.log('✅ Simple web build completed successfully!');
console.log('📁 Output directory: web-build/');
console.log('🌐 You can now deploy this to Netlify or any other hosting service');
