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
   Build command: npx expo start --web --port 8888
   Publish directory: web-build
   ```

5. **Voeg environment variables toe:**
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://trrsgvxoylhcudtiimvb.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_PLATFORM=web
   ```

6. **Klik op "Deploy site"**

### **Optie 2: Manual Deploy**

1. **Start de Expo web server:**
   ```bash
   npx expo start --web
   ```

2. **Open de app in je browser op `http://localhost:8081`**

3. **Deploy naar Netlify via de Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

## 📱 **Mobile App Deploy**

### **iOS App Store**
```bash
# Build voor iOS
npm run build:ios

# Upload naar App Store Connect
eas submit --platform ios
```

### **Google Play Store**
```bash
# Build voor Android
npm run build:android

# Upload naar Google Play Console
eas submit --platform android
```

## 🔧 **Environment Variables**

### **Lokaal Development**
Maak een `.env.local` bestand aan:
```env
EXPO_PUBLIC_SUPABASE_URL=https://trrsgvxoylhcudtiimvb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_PLATFORM=web
```

### **Netlify**
Voeg deze toe in je Netlify dashboard onder Site settings > Environment variables.

## 🚨 **Troubleshooting**

### **Build Fouten**
- **NativeWind problemen**: Gebruik de directe deploy strategie
- **React Native Reanimated**: Alleen beschikbaar op native platforms
- **Metro bundler errors**: Probeer `npx expo start --clear`

### **Runtime Fouten**
- **Supabase connectie**: Controleer environment variables
- **Service Worker**: Alleen beschikbaar op web
- **Platform-specifieke code**: Gebruik Platform.select() voor cross-platform compatibiliteit

## 📊 **Performance Monitoring**

### **Web Performance**
- Lighthouse scores
- Core Web Vitals
- Bundle size analyse

### **Mobile Performance**
- React Native Performance Monitor
- Flipper debugging
- Expo DevTools

## 🔒 **Security Checklist**

- [ ] Environment variables zijn geheim
- [ ] Supabase Row Level Security is actief
- [ ] API rate limiting is geïmplementeerd
- [ ] HTTPS is geforceerd
- [ ] Content Security Policy is ingesteld

## 📈 **Scaling**

### **Web**
- Netlify Functions voor serverless backend
- CDN optimalisatie
- Image optimization

### **Mobile**
- EAS Build voor cloud builds
- OTA updates via Expo
- Crash reporting met Sentry

## 🎯 **Volgende Stappen**

1. **Deploy naar Netlify** ✅
2. **Test alle functionaliteiten** ✅
3. **Monitor performance** ✅
4. **Implementeer analytics** ✅
5. **Setup monitoring** ✅
