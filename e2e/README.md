# E2E Testing met Detox

Deze directory bevat alle E2E (End-to-End) tests voor de Straat-Praat applicatie, gebouwd met Detox voor betrouwbare cross-platform testing.

## 🧪 Test Suite Overzicht

### `auth.test.js`
Complete authenticatie flow tests:
- Login en registratie
- Wachtwoord validatie en strength indicator
- Wachtwoord reset functionaliteit
- Error handling en validatie

### `mfa.test.js`
MFA (Multi-Factor Authentication) setup en verificatie:
- MFA setup proces
- TOTP code verificatie
- Backup codes generatie en gebruik
- MFA activatie/deactivatie
- Login met MFA vereiste

## 🚀 Setup en Configuratie

### Vereisten
- Node.js 18+
- iOS Simulator (voor iOS tests)
- Android Emulator (voor Android tests)
- Detox CLI: `npm install -g detox-cli`

### Installatie
```bash
# Installeer dependencies
npm install

# Build de app voor testing
npm run build:ios     # iOS
npm run build:android # Android
```

### Detox Configuratie
De `detox.config.js` bevat configuraties voor:
- **iOS Simulator**: iPhone 15 met iOS 17.0
- **Android Emulator**: Pixel 7 met API 34
- **Debug en Release builds**
- **Artifact collection**: Screenshots, video, logs

## 🧪 Tests Uitvoeren

### Alle E2E Tests
```bash
# iOS Simulator
npm run test:e2e:ios

# Android Emulator
npm run test:e2e:android

# Standaard (iOS)
npm run test:e2e
```

### Specifieke Test Suites
```bash
# Alleen authenticatie tests
detox test --configuration ios.sim.debug --grep "Authentication Flow"

# Alleen MFA tests
detox test --configuration ios.sim.debug --grep "MFA Setup and Verification"
```

### Test Opties
```bash
# Met debug output
detox test --configuration ios.sim.debug --loglevel trace

# Met specifieke device
detox test --configuration ios.sim.debug --device "iPhone 15"

# Met retry logic
detox test --configuration ios.sim.debug --retries 3
```

## 🛠️ Test Utilities

### Global Helpers
De `setup.js` bevat utility functions:
- `waitForElement()`: Wacht tot element zichtbaar is
- `tapWithRetry()`: Tap met retry logic
- `typeTextWithRetry()`: Type text met retry logic
- `login()`: Helper voor login flow
- `logout()`: Helper voor logout flow
- `verifyMFA()`: Helper voor MFA verificatie

### Test Environment
- **Language**: Nederlands (nl)
- **Locale**: nl_NL
- **Orientation**: Portrait
- **Cleanup**: App wordt automatisch afgesloten na tests

## 📱 Device Configuratie

### iOS Simulator
```json
{
  "type": "ios.simulator",
  "device": {
    "type": "iPhone 15",
    "os": "17.0"
  }
}
```

### Android Emulator
```json
{
  "type": "android.emulator",
  "device": {
    "avdName": "Pixel_7_API_34"
  }
}
```

## 📊 Test Resultaten

### Artifacts
Tests genereren automatisch:
- **Screenshots**: Bij elke test stap
- **Video**: Van complete test uitvoering
- **Logs**: Console output en errors
- **JUnit XML**: Voor CI/CD integratie

### Coverage
- **Test Results**: JUnit XML format
- **Screenshots**: PNG format
- **Video**: MP4 format
- **Logs**: Text format

## 🔧 Troubleshooting

### Veelvoorkomende Problemen

#### iOS Simulator Issues
```bash
# Reset simulator
xcrun simctl erase all

# Check beschikbare simulators
xcrun simctl list devices

# Start specifieke simulator
xcrun simctl boot "iPhone 15"
```

#### Android Emulator Issues
```bash
# Check beschikbare AVDs
emulator -list-avds

# Start specifieke AVD
emulator -avd Pixel_7_API_34

# Reset emulator
emulator -wipe-data -avd Pixel_7_API_34
```

#### Detox Issues
```bash
# Clean detox cache
detox clean-framework-cache

# Rebuild app
detox build --configuration ios.sim.debug

# Check detox doctor
detox doctor
```

### Debug Tips
- Gebruik `--loglevel trace` voor uitgebreide logging
- Check device logs tijdens test uitvoering
- Verifieer app build en installatie
- Controleer network connectivity

## 📈 CI/CD Integratie

### GitHub Actions
De E2E tests zijn geïntegreerd in de CI/CD pipeline:
- Automatische test uitvoering op pull requests
- Parallel iOS en Android testing
- Artifact upload naar GitHub
- Test resultaten in pull request comments

### Local Development
```bash
# Watch mode voor development
detox test --configuration ios.sim.debug --watch

# Debug mode
detox test --configuration ios.sim.debug --debug-synchronization 200
```

## 🎯 Best Practices

### Test Schrijven
- Gebruik beschrijvende test namen
- Test één functionaliteit per test
- Gebruik helper functions voor herbruikbare code
- Implementeer proper cleanup in `afterEach`

### Performance
- Houd tests kort en gefocust
- Gebruik `waitFor` in plaats van `sleep`
- Implementeer retry logic voor flaky tests
- Optimaliseer test data en setup

### Reliability
- Gebruik unique identifiers voor element selection
- Implementeer proper error handling
- Test edge cases en error scenarios
- Valideer test results met multiple assertions

## 📚 Meer Informatie

- [Detox Documentation](https://wix.github.io/Detox/)
- [React Native Testing](https://reactnative.dev/docs/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [E2E Testing Best Practices](https://testing-library.com/docs/guiding-principles)
