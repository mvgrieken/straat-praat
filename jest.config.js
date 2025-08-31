module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.expo/**',
    '!**/supabase/functions/**',
    '!**/app/**',
    '!**/components/**',
    '!**/hooks/**',
    '!**/types/**',
    '!**/constants/**',
    '!**/scripts/**',
    '!**/src/lib/types/**',
    '!**/src/lib/validations/**',
    '!**/src/env.ts',
    '!**/jest.setup.js',
    '!**/jest.config.js',
    '!**/.eslintrc.js',
    '!**/expo-env.d.ts',
    '!**/router.d.ts',
    '!**/nativewind.d.ts',
    '!**/database.types.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};
