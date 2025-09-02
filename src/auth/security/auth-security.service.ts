import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from './security.config';

@Injectable()
export class AuthSecurityService {
  private readonly logger = new Logger(AuthSecurityService.name);
  private failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  private tokenCache = new Map<string, { valid: boolean; expiry: Date }>();

  constructor(private configService: ConfigService) {
    // Clean up expired entries periodically
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Check if account is locked due to too many failed attempts
   */
  isAccountLocked(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return false;

    const lockoutDuration = SecurityConfig.ACCOUNT.LOCKOUT_DURATION;
    const maxAttempts = SecurityConfig.ACCOUNT.MAX_LOGIN_ATTEMPTS;

    if (attempts.count >= maxAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      if (timeSinceLastAttempt < lockoutDuration) {
        this.logger.warn(`Account locked for ${identifier}. Attempts: ${attempts.count}`);
        return true;
      } else {
        // Lockout period expired, reset attempts
        this.failedAttempts.delete(identifier);
      }
    }

    return false;
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): void {
    const current = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    current.count += 1;
    current.lastAttempt = new Date();
    
    this.failedAttempts.set(identifier, current);
    
    if (SecurityConfig.AUDIT.LOG_FAILED_ATTEMPTS) {
      this.logger.warn(`Failed login attempt for ${identifier}. Count: ${current.count}`);
    }

    // Alert on suspicious activity
    if (SecurityConfig.AUDIT.ALERT_ON_SUSPICIOUS_ACTIVITY &&
        current.count >= SecurityConfig.AUDIT.SUSPICIOUS_ACTIVITY_THRESHOLD) {
      this.logger.error(`SECURITY ALERT: Suspicious activity detected for ${identifier}. Failed attempts: ${current.count}`);
    }
  }

  /**
   * Clear failed attempts after successful login
   */
  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SecurityConfig.PASSWORD;

    if (password.length < config.MIN_LENGTH) {
      errors.push(`Password must be at least ${config.MIN_LENGTH} characters long`);
    }

    if (password.length > config.MAX_LENGTH) {
      errors.push(`Password must not exceed ${config.MAX_LENGTH} characters`);
    }

    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate JWT secret strength
   */
  validateJwtSecret(): void {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret || secret.length < SecurityConfig.JWT.SECRET_MIN_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${SecurityConfig.JWT.SECRET_MIN_LENGTH} characters long for production use`
      );
    }

    // Check for common weak secrets
    const weakSecrets = ['secret', 'jwt-secret', '123456', 'password', 'your-secret-key'];
    if (weakSecrets.includes(secret.toLowerCase())) {
      throw new Error('JWT_SECRET appears to be a weak/default value. Please use a strong, unique secret.');
    }

    this.logger.log('JWT secret validation passed');
  }

  /**
   * Get security headers configuration
   */
  getSecurityHeaders() {
    return SecurityConfig.SECURITY_HEADERS;
  }

  /**
   * Cache social token validation result
   */
  cacheSocialTokenValidation(token: string, provider: string, isValid: boolean): void {
    if (!SecurityConfig.SOCIAL_AUTH.CACHE_VALIDATION_RESULTS) return;

    const cacheKey = `${provider}:${token.substring(0, 20)}`;
    const expiry = new Date(Date.now() + (SecurityConfig.SOCIAL_AUTH.CACHE_TTL * 1000));
    
    this.tokenCache.set(cacheKey, { valid: isValid, expiry });
  }

  /**
   * Get cached social token validation result
   */
  getCachedSocialTokenValidation(token: string, provider: string): boolean | null {
    if (!SecurityConfig.SOCIAL_AUTH.CACHE_VALIDATION_RESULTS) return null;

    const cacheKey = `${provider}:${token.substring(0, 20)}`;
    const cached = this.tokenCache.get(cacheKey);
    
    if (!cached || cached.expiry < new Date()) {
      this.tokenCache.delete(cacheKey);
      return null;
    }

    return cached.valid;
  }

  /**
   * Validate environment configuration for production
   */
  validateProductionConfig(): void {
    const requiredEnvVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'NODE_ENV',
    ];

    const socialProviders = ['google', 'facebook', 'apple', 'microsoft'];
    
    // Add social provider configs if any are enabled
    socialProviders.forEach(provider => {
      const clientId = this.configService.get<string>(`${provider.toUpperCase()}_CLIENT_ID`);
      if (clientId) {
        requiredEnvVars.push(`${provider.toUpperCase()}_CLIENT_SECRET`);
      }
    });

    const missing = requiredEnvVars.filter(envVar => 
      !this.configService.get<string>(envVar)
    );

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret
    this.validateJwtSecret();

    // Check if running in production with debug settings
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      const debugSettings = [
        'DEBUG',
        'TYPEORM_LOGGING',
        'CORS_ORIGIN_WILDCARD',
      ];

      debugSettings.forEach(setting => {
        const value = this.configService.get<string>(setting);
        if (value === 'true' || value === '1') {
          this.logger.warn(`WARNING: ${setting} is enabled in production environment`);
        }
      });
    }

    this.logger.log('Production security configuration validation passed');
  }

  /**
   * Generate secure random string for tokens
   */
  generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove basic HTML chars
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Log security event for audit purposes
   */
  logSecurityEvent(event: string, details: Record<string, any>): void {
    if (!SecurityConfig.AUDIT.LOG_AUTH_EVENTS) return;

    this.logger.log(`SECURITY_EVENT: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Clean up expired entries from memory caches
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    
    // Clean up failed attempts older than lockout duration
    for (const [key, value] of this.failedAttempts.entries()) {
      const timeSinceLastAttempt = now.getTime() - value.lastAttempt.getTime();
      if (timeSinceLastAttempt > SecurityConfig.ACCOUNT.LOCKOUT_DURATION * 2) {
        this.failedAttempts.delete(key);
      }
    }

    // Clean up expired token cache entries
    for (const [key, value] of this.tokenCache.entries()) {
      if (value.expiry < now) {
        this.tokenCache.delete(key);
      }
    }
  }
}