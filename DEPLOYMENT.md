# 🚀 Deployment Handleiding - Straat-Praat

## 📱 **Platforms**
- ✅ **iOS**: Via Expo EAS Build
- ✅ **Android**: Via Expo EAS Build  
- ✅ **Web**: Via Netlify (Aanbevolen) of Vercel

## 🌐 **Web Deploy naar Netlify**

### **Optie 1: Directe Deploy (Aanbevolen)**

1. **Ga naar [Netlify](https://netlify.com) en log in**

2. **Klik op "New site from Git"**

3. **Kies GitHub en selecteer je `straat-praat` repository**

4. **Configureer de build instellingen:**
   ```
   Build command: npm run start:web
   Publish directory: web-build
   ```

5. **Voeg environment variables toe:**
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://trrsgvxoylhcudtiimvb.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

6. **Klik op "Deploy site"**

### **Optie 2: Manual Deploy**

1. **Start de Expo web server:**
   ```bash
   npm run start:web
   ```

2. **Open http://localhost:8081 in je browser**

3. **Gebruik Netlify CLI voor deploy:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=web-build
   ```

## 📱 **Mobile App Deploy**

### **iOS App Store**
```bash
npm run build:ios
# Volg de EAS Build instructies
```

### **Google Play Store**
```bash
npm run build:android
# Volg de EAS Build instructies
```

## 🔧 **Troubleshooting**

### **Web Build Problemen**
- **React Native Reanimated**: Gebruik `npm run start:web` in plaats van build
- **NativeWind**: Werkt alleen in development mode voor nu
- **Metro Bundler**: Start opnieuw met `--clear` flag

### **Environment Variables**
- Zorg dat alle `EXPO_PUBLIC_*` variabelen zijn ingesteld
- Controleer Supabase configuratie in `app.json`

## 📊 **Deploy Status**

- ✅ **GitHub**: Repository is up-to-date
- ✅ **Netlify**: Configuratie klaar
- ⚠️ **Web Build**: Gebruik development server voor nu
- ✅ **Mobile**: EAS Build klaar

## 🎯 **Volgende Stappen**

1. **Deploy naar Netlify** (gebruik Optie 1)
2. **Test alle functionaliteit** op de live site
3. **Fix eventuele runtime problemen**
4. **Optimaliseer voor productie**

## 📞 **Support**

Voor deploy problemen:
- Check de Expo logs
- Controleer Netlify build logs
- Verifieer environment variables
