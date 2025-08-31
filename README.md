# Straat-Praat 🗣️

Een React Native app voor ouders om jongerenslang te leren en begrijpen.

## 📱 Over de App

Straat-Praat helpt ouders om de moderne jongerenslang te begrijpen waarmee hun tieners communiceren. De app biedt:

- **Vertaalfunctie**: Vertaal slangwoorden naar Nederlands en omgekeerd
- **Spraakherkenning**: Spreek woorden in voor snelle herkenning
- **Quizzes**: Test je kennis met verschillende moeilijkheidsgraden  
- **Gamification**: Verdien punten, behaal prestaties en houd streaks bij
- **Woord van de Dag**: Leer dagelijks een nieuw slangwoord
- **Profiel & Instellingen**: Personaliseer je leerervaring

## 🚀 Tech Stack

- **Frontend**: React Native met Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Styling**: Tailwind CSS via NativeWind
- **State Management**: React Query + Zustand
- **Navigation**: Expo Router
- **Cross-Platform**: iOS, Android, Web

## 🛠️ Development Setup

### Vereisten

- Node.js (v18+)
- npm/yarn
- Expo CLI
- Supabase account

### Installatie

1. Clone de repository:
```bash
git clone https://github.com/mvgrieken/straat-praat.git
cd straat-praat
```

2. **Belangrijk**: Gebruik de juiste Node.js versie:
```bash
# Als je nvm gebruikt:
nvm use

# Of installeer Node.js 18.20.0+ handmatig
```

3. Installeer dependencies (met optimalisaties):
```bash
# Voor development:
npm install --legacy-peer-deps

# Voor CI/CD:
CI=1 ADBLOCK=1 HUSKY=0 npm install --no-audit --no-fund --legacy-peer-deps
```

4. Configureer environment variables:
```bash
cp .env.example .env.local
# Vul je Supabase credentials in
```

5. Start de development server:
```bash
npm start
```

### Platform-specifiek starten

```bash
# iOS
npm run ios

# Android  
npm run android

# Web
npm run web
```

## 📁 Project Structuur

```
straat-praat/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth/              # Authentication screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
├── services/             # API services (Supabase)
├── types/                # TypeScript type definitions
├── constants/            # App constants
├── assets/               # Images, icons, fonts
└── docs/                 # Documentation
```

## 🔧 Scripts

- `npm start` - Start Expo development server
- `npm run build` - Build for production (EAS Build)
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type check

## 🌐 Deployment

### Web (Netlify)
De app is automatisch gedeployed naar [straat-praat.netlify.app](https://straat-praat.netlify.app)

### Mobile (EAS Build)
```bash
# Build voor iOS/Android
npm run build
```

## 🔐 Environment Variables

### Client-side (veilig)
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Server-side (geheim)  
- `SUPABASE_SERVICE_ROLE_KEY` - Voor admin operaties
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🙏 Dankbetuigingen

- Gebouwd met [Expo](https://expo.dev/)
- Powered by [Supabase](https://supabase.com/)  
- Styling met [Tailwind CSS](https://tailwindcss.com/)

---

**Disclaimer**: Deze app is bedoeld voor educatieve doeleinden om ouders te helpen de taal van jongeren beter te begrijpen.