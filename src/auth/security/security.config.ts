export const SecurityConfig = {
  // JWT Configuration
  JWT: {
    SECRET_MIN_LENGTH: 32,
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256' as const,
  },
  
  // Password Security
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    SALT_ROUNDS: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    AUTH_ENDPOINTS: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 attempts per window
      skipSuccessfulRequests: true,
    },
    SOCIAL_AUTH: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 5, // 5 attempts per window
    },
    REFRESH_TOKEN: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 refreshes per minute
    },
  },
  
  // Social Provider Security
  SOCIAL_AUTH: {
    TOKEN_VALIDATION_TIMEOUT: 5000, // 5 seconds
    REQUIRED_SCOPES: {
      google: ['email', 'profile'],
      facebook: ['email'],
      apple: ['email', 'name'],
      microsoft: ['email', 'profile'],
    },
    CACHE_VALIDATION_RESULTS: true,
    CACHE_TTL: 300, // 5 minutes
  },
  
  // Security Headers
  SECURITY_HEADERS: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  },
  
  // Session Security
  SESSION: {
    MAX_CONCURRENT_SESSIONS: 5,
    ABSOLUTE_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  },
  
  // Account Security
  ACCOUNT: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    PASSWORD_RESET_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
    EMAIL_VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    REQUIRE_EMAIL_VERIFICATION: true,
    ALLOW_SOCIAL_ACCOUNT_LINKING: true,
  },
  
  // Audit and Monitoring
  AUDIT: {
    LOG_AUTH_EVENTS: true,
    LOG_FAILED_ATTEMPTS: true,
    LOG_SOCIAL_AUTH: true,
    LOG_TOKEN_REFRESH: false, // Too verbose for production
    ALERT_ON_SUSPICIOUS_ACTIVITY: true,
    SUSPICIOUS_ACTIVITY_THRESHOLD: 10, // Failed attempts before alert
  },
};