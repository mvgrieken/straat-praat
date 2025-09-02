module.exports = {
  // Production environment configuration
  environment: 'production',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    ssl: true,
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Redis configuration for caching
  redis: {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '24h',
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  },
  
  // Monitoring configuration
  monitoring: {
    logLevel: 'info',
    enableMetrics: true,
    metricsPort: 9090,
    healthCheckInterval: 30000, // 30 seconds
    alerting: {
      enabled: true,
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
      emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
    },
  },
  
  // Performance configuration
  performance: {
    compression: true,
    cacheControl: {
      static: 'public, max-age=31536000', // 1 year
      api: 'public, max-age=300', // 5 minutes
    },
    timeout: {
      request: 30000, // 30 seconds
      response: 30000, // 30 seconds
    },
  },
  
  // File storage configuration
  storage: {
    provider: 'supabase', // or 'aws-s3', 'google-cloud'
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
  
  // Email configuration
  email: {
    provider: 'sendgrid', // or 'aws-ses', 'mailgun'
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    templates: {
      welcome: 'd-welcome-template-id',
      passwordReset: 'd-password-reset-template-id',
      mfaSetup: 'd-mfa-setup-template-id',
    },
  },
  
  // Third-party services
  services: {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    analytics: {
      enabled: true,
      provider: 'mixpanel', // or 'google-analytics', 'amplitude'
      apiKey: process.env.MIXPANEL_API_KEY,
    },
  },
  
  // Feature flags
  features: {
    mfa: true,
    advancedSecurity: true,
    performanceMonitoring: true,
    userAnalytics: true,
    backupCodes: true,
    sessionManagement: true,
  },
};
