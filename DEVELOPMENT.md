# 🚀 STRAAT PRAAT - Development Guide

## 📋 Vereisten

- Node.js 18+ of 20+
- npm of yarn
- Expo CLI
- Git

## 🛠️ Setup

```bash
# Clone repository
git clone <repository-url>
cd straat-praat

# Install dependencies
npm install

# Setup Husky hooks
npm run prepare

# Start development server
npm start
```

## 🧪 Testing

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Coverage

We streven naar **70% test coverage** voor alle code:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Test Structure

```
__tests__/
├── basic.test.ts              # Basic functionality tests
├── utils/
│   └── stringUtils.test.ts    # Utility function tests
└── services/
    ├── wordService.test.ts    # WordService tests
    ├── translationService.test.ts  # TranslationService tests
    └── gamificationService.test.ts # GamificationService tests
```

## 🔧 Development Workflow

### Pre-commit Hooks

We gebruiken Husky en lint-staged voor automatische code quality checks:

- **ESLint**: Code linting en formatting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Jest**: Unit tests

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck
```

### Git Workflow

1. **Feature Branch**: Maak een feature branch van `develop`
2. **Development**: Schrijf code en tests
3. **Pre-commit**: Hooks runnen automatisch
4. **Commit**: Commit met beschrijvende message
5. **Push**: Push naar feature branch
6. **Pull Request**: Maak PR naar `develop`

## 🏗️ Project Structuur

```
straat-praat/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation
│   ├── auth/              # Authentication screens
│   └── onboarding/        # Onboarding flow
├── components/            # Reusable React components
├── services/             # Business logic services
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── __tests__/            # Test files
├── supabase/             # Database migrations
└── docs/                 # Documentation
```

## 🗄️ Database

### Supabase Setup

1. **Environment Variables**: Zet Supabase URL en keys in `.env`
2. **Migrations**: Database schema in `supabase/migrations/`
3. **Types**: Auto-generated types in `types/database.types.ts`

### Database Schema

- **profiles**: User profiles and settings
- **slang_words**: Dictionary of slang words
- **user_progress**: User learning progress
- **quiz_sessions**: Quiz completion data
- **achievements**: Gamification achievements
- **user_achievements**: User achievement unlocks

## 🚀 Deployment

### Web Deployment

```bash
# Build for web
npm run build:web

# Deploy to Netlify/Vercel
# (Configured via CI/CD)
```

### Mobile Deployment

```bash
# Build for Android
npm run build:android

# Build for iOS
npm run build:ios
```

## 🔍 Debugging

### Common Issues

1. **Test Failures**: Check database schema mismatch
2. **Type Errors**: Run `npm run typecheck`
3. **Lint Errors**: Run `npm run lint:fix`
4. **Build Failures**: Check environment variables

### Debug Commands

```bash
# Check Expo setup
npm run doctor

# Clear cache
npx expo start --clear

# Reset Metro cache
npx expo start --reset-cache
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. **Fork** het project
2. **Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** (`git commit -m 'Add some AmazingFeature'`)
4. **Push** (`git push origin feature/AmazingFeature`)
5. **Pull Request**

## 📝 Code Standards

- **TypeScript**: Gebruik strict mode
- **ESLint**: Volg linting rules
- **Prettier**: Consistent formatting
- **Tests**: Schrijf tests voor nieuwe features
- **Documentation**: Update docs bij wijzigingen

## 🚨 Security

- **Environment Variables**: Nooit secrets in code
- **Input Validation**: Valideer alle user input
- **SQL Injection**: Gebruik parameterized queries
- **Authentication**: Check user permissions

---

**Happy Coding! 🎉**
