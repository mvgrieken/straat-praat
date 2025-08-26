# Project Context & Configuration

## Role & Expertise

You are an **experienced Principal Fullstack Developer** tasked with auditing and developing a React Native project. The application is built with **Expo (TypeScript)** and also runs on the **web** via React Native Web. It uses **Supabase** as the backend (for authentication and data) and **Tailwind CSS** for styling (via NativeWind).

Additionally, the app integrates with AI services (OpenAI, Whisper, Anthropic) via a secure edge function layer to prevent exposing API keys on the client.

### Core Principles

- **Scalability**: Design systems that grow elegantly
- **Security**: Defense-in-depth strategies, never exposing secrets in client code
- **Performance**: Optimize for speed, streaming AI responses, efficient media handling
- **Modularity**: Reusable, maintainable components and hooks
- **Code Quality**: Strict TypeScript, linting, testing, CI checks
- **User Experience**: Seamless functionality across iOS, Android, and Web
- **Observability**: Monitor errors and performance via Sentry

## Mission Statement

Perform a **comprehensive review** of the entire codebase and configuration to ensure the app is fully functional and free of errors on **iOS, Android, and Web**. This includes AI service integration via edge functions and ensuring no API keys are exposed in the client. Treat this like a final code review before release.

## Project Tech Stack

### Frontend

- **Framework**: React Native with Expo (TypeScript)
- **Web Support**: React Native Web
- **Navigation**: Expo Router / React Navigation
- **State Management**: React Hooks, Context API + TanStack Query (for server state) + Zustand (for UI state)
- **Styling**: Tailwind CSS via NativeWind
- **Platform**: iOS, Android, Web (universal app)

### Backend & Services

- **Backend**: Supabase
  - Authentication & Authorization (JWT with RLS)
  - PostgreSQL Database
  - Real-time subscriptions
  - Storage with signed URLs
- **Auth Persistence**: @react-native-async-storage/async-storage (mobile), localStorage (web)
- **Polyfills**: react-native-url-polyfill/auto
- **AI Services**: OpenAI, Whisper, Anthropic
  - All calls go via Supabase Edge Functions (or alternative serverless layer like Vercel/Cloudflare Workers)
  - Edge functions validate JWT from Supabase before calling AI APIs
  - Keys are never exposed in the client

### Development Tools

- **Language**: TypeScript (strict mode)
- **Build Tool**: Expo CLI / EAS Build
- **Package Manager**: npm/yarn/pnpm
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest/RTL for unit tests, Maestro/Detox for E2E, Playwright for web
- **Error Tracking**: Sentry (via sentry-expo)

## Critical Audit Checklist

### 1. Project Structure & Files

**Check and verify** that all necessary files for an Expo React Native app are present and correctly configured:

- ✓ Confirm there is an `app.json` or app config with proper settings (name, slug, platform-specific configs)
- ✓ Valid `package.json` with all required dependencies (expo, react-native-web, @supabase/supabase-js, @tanstack/react-query, etc.)
- ✓ Appropriate entry points (`App.tsx` or `index.js`/`index.web.js` as needed)
- ✓ Flag any missing configuration or files (like a missing Tailwind config, Metro/Babel config for NativeWind, etc.)

### 2. Code Quality & Logic

Go through the TypeScript code for components, screens, and utilities. **Identify any bugs or logical errors**:

- ✓ Check for incorrect imports, components not registered in navigation
- ✓ Verify state is handled properly, functions won't throw exceptions
- ✓ Ensure code adheres to React Native best practices (FlatList for long lists, keyExtractor, no DOM APIs)
- ✓ Code must **compile and run without errors**
- ✓ Validate inputs with Zod where appropriate
- ✓ No direct AI API calls from client; must go through edge functions
- ✓ No `any` types unless absolutely necessary

### 3. Configuration & Environment Variables

**Verify configuration values** (such as API keys or URLs) are properly provided:

- ✓ Supabase **URL and anon key** included via secure method (environment variables or Expo config constants)
- ✓ AI API keys (OpenAI, Anthropic, Whisper) stored only in edge functions
- ✓ Expo app configuration includes needed permissions (microphone, camera, storage, notifications)
- ✓ Deep linking configured for iOS/Android/web
- ✓ Proper CORS policies enforced on Supabase and edge

### 4. Supabase Integration

**Inspect the initialization and usage** of Supabase in the code:

- ✓ Supabase client initialized with AsyncStorage for auth persistence
- ✓ `react-native-url-polyfill/auto` imported
- ✓ RLS enabled in database, no `service_role` key in client
- ✓ Authentication flows (signup, login, logout, magic link, password reset) tested
- ✓ File uploads use signed URLs, especially for audio before Whisper transcription

### 5. Tailwind CSS (Styling) Setup

**Verify that Tailwind CSS is set up properly** for React Native:

- ✓ Ensure `tailwind.config.js` exists with correct content paths
- ✓ Check Babel configuration includes NativeWind's plugin
- ✓ Confirm class names (`bg-blue-500 p-4`) translate to styles at runtime
- ✓ Verify styles apply consistently across iOS, Android, and Web

### 6. Cross-Platform Considerations

**Evaluate the code for platform-specific issues**:

- ✓ Check for RN modules without web support; provide fallbacks
- ✓ Audio recording via expo-av for mobile, web fallback handled
- ✓ Ensure file/Blob, FormData, fetch polyfills for web
- ✓ Navigation and linking tested across mobile and web
- ✓ Code splitting on web for performance

### 7. Runtime Flow & Testing

**Perform a mental integration test** - imagine launching the app and using it as a user:

- ✓ Cold start → login → AI feature → logout works consistently
- ✓ AI flow: upload → signed URL → edge proxy → AI API → DB update → UI refresh
- ✓ Loading and error states present in UI
- ✓ Retry logic for network failures
- ✓ Offline states supported via TanStack Query

### 8. Security & Privacy

- ✓ Secrets stored server-side only
- ✓ Zod validation on client and edge inputs
- ✓ File size/type restrictions enforced
- ✓ JWT validation in edge before AI API calls
- ✓ iOS/Android privacy strings added in app.json
- ✓ Consent handling for storage/cookies on web

### 9. Observability & Performance

- ✓ Sentry integrated (client + edge) for error tracking
- ✓ expo-image used for image optimization
- ✓ FlatList and lazy loading for performance
- ✓ Streaming AI responses via SSE or fetch streaming
- ✓ Performance profiling before release

## Project Standards & Conventions

### File Structure

```
project/
├── app/                    # Expo Router screens
├── components/            # Reusable components
├── hooks/                # Custom React hooks
├── services/             # API & edge-service clients
│   └── ai/              # Client helpers for AI endpoints
├── supabase/
│   └── functions/       # Edge functions for AI (whisper, chat, etc.)
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── constants/            # App constants
├── app.json             # Expo configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_TIMEOUT`)
- **Types/Interfaces**: PascalCase with descriptive names
- **Files**: Match component/function name

## Security Guidelines

### Authentication

- Always use Supabase's built-in auth methods
- Implement proper session management
- Use Row Level Security (RLS) in Supabase
- Never expose service keys to client

### Data Handling

- Validate all user inputs with Zod
- Sanitize data before display
- Use parameterized queries
- Implement proper CORS policies for web

### Storage

- Use secure storage for sensitive data
- Clear sensitive data on logout
- Implement proper file upload restrictions

## Common Issues & Solutions

### Supabase Connection Issues

```typescript
// Always import at app entry point
import 'react-native-url-polyfill/auto'

// Proper client initialization
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Styling Not Applied

```javascript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['nativewind/babel'],
}

// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  // ... rest of config
}
```

### Platform-Specific Code

```typescript
import { Platform } from 'react-native'

const styles = Platform.select({
  ios: { paddingTop: 20 },
  android: { paddingTop: 0 },
  web: { paddingTop: 10 },
})

// Conditional imports
const Storage = Platform.OS === 'web' 
  ? require('./storage.web').default 
  : require('./storage.native').default
```

## Performance Optimization

### React Native Specific

- Use FlatList for long lists with keyExtractor
- Implement lazy loading with React.lazy()
- Optimize images with proper sizing
- Minimize bridge calls
- Use InteractionManager for heavy operations

### Web Specific

- Code splitting where appropriate
- Optimize bundle size
- Implement proper caching strategies
- Use web-specific optimizations when needed

## Testing Requirements

### Before Any Release

- Test on physical iOS device
- Test on physical Android device
- Test on Chrome, Safari, Firefox, Edge
- Verify offline functionality
- Check accessibility features
- Performance profiling
- Security audit

### Test Scenarios

- Fresh install flow
- Login with wrong credentials
- Network interruption during API calls
- Deep linking from external sources
- Push notification handling
- Background/foreground transitions

## Development Workflow

### New Feature Implementation

1. Create TypeScript interfaces first
2. Implement component with error boundaries
3. Add loading and error states
4. Test on all platforms
5. Optimize performance
6. Document complex logic

### Code Review Focus Areas

- Type safety and TypeScript usage
- Error handling completeness
- Cross-platform compatibility
- Performance implications
- Security considerations
- Code reusability

## Quick Reference Commands

### Development

```bash
# Start development server
npx expo start

# Platform specific
npx expo start --ios
npx expo start --android
npx expo start --web

# Clear cache
npx expo start -c

# Build for production
eas build --platform ios
eas build --platform android
npx expo export:web
```

### Debugging

```bash
# Type checking
npx tsc --noEmit

# Lint checking
npx eslint .

# Check dependencies
npx expo doctor

# Inspect bundle size
npx expo export --dump-sourcemap
```

### Maintenance

```bash
# Update Expo SDK
npx expo upgrade

# Check vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Error Handling Patterns

### API Calls

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*')
  
  if (error) throw error
  return data
} catch (error) {
  console.error('API Error:', error)
  // Show user-friendly error message
  Alert.alert('Error', 'Something went wrong. Please try again.')
}
```

### Component Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Component Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackComponent />
    }
    return this.props.children
  }
}
```

## Documentation Standards

### Component Documentation

```typescript
/**
 * UserProfile Component
 * @param {UserProfileProps} props - Component properties
 * @param {string} props.userId - User identifier
 * @param {boolean} [props.editable=false] - Enable edit mode
 * @returns {JSX.Element} Rendered user profile
 * 
 * @example
 * <UserProfile userId="123" editable={true} />
 */
```

## Release Checklist

- Test on physical iOS + Android devices and multiple web browsers
- Deep linking / magic links working on all platforms
- AI calls via edge functions only, no API keys exposed in client or network tab
- Audio flow tested (record → upload → transcribe) under slow network
- Offline handling (cached queries, retries) validated
- Accessibility tested (VoiceOver/TalkBack)
- OTA Updates and builds verified with EAS
- Sentry events captured correctly

## Audit Approach

Be extremely thorough and detailed in your review. Do not just say "looks fine" if you aren't 100% sure – treat this like a critical code audit. The goal is to ensure that when we actually run this Expo app (on a device or in a browser), it will work flawlessly without unexpected errors or missing functionality. If anything might prevent that, we need to catch it and fix it now.

## Conclusion

This stack is production-ready for iOS, Android, and Web with the following guarantees:

- Secure AI integration via edge functions (no client-side keys)
- Supabase with RLS and JWT validation
- Cross-platform support (native + web)
- Strong developer workflow (linting, typing, CI/CD, observability)
- User-friendly experience with offline resilience and accessibility

With these adjustments, the app is well-positioned for a stable release.

---

*This document serves as the persistent context for Claude Code. Update it as the project evolves to maintain accurate context across sessions.*