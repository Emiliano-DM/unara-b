#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthSecurityService } from '../src/auth/security/auth-security.service';
import { Logger } from '@nestjs/common';

async function validateProductionReadiness() {
  const logger = new Logger('ProductionValidator');
  
  logger.log('🔍 Starting production readiness validation...');
  
  try {
    // Initialize app to access services
    const app = await NestFactory.createApplicationContext(AppModule);
    const authSecurity = app.get(AuthSecurityService);
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // 1. Validate environment configuration
    logger.log('✅ Validating environment configuration...');
    try {
      authSecurity.validateProductionConfig();
      logger.log('   ✓ Environment configuration valid');
    } catch (error) {
      issues.push(`Environment configuration: ${error.message}`);
    }
    
    // 2. Check critical environment variables
    logger.log('✅ Checking critical environment variables...');
    const requiredEnvVars = [
      'NODE_ENV',
      'JWT_SECRET',
      'DATABASE_URL',
      'PORT',
    ];
    
    const optionalButRecommended = [
      'CORS_ORIGIN',
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX_REQUESTS',
      'LOG_LEVEL',
      'GOOGLE_CLIENT_ID',
      'FACEBOOK_APP_ID',
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      } else {
        logger.log(`   ✓ ${envVar} is set`);
      }
    });
    
    optionalButRecommended.forEach(envVar => {
      if (!process.env[envVar]) {
        warnings.push(`Recommended environment variable not set: ${envVar}`);
      } else {
        logger.log(`   ✓ ${envVar} is set`);
      }
    });
    
    // 3. Validate JWT secret strength
    logger.log('✅ Validating JWT secret...');
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      if (jwtSecret.length < 32) {
        issues.push('JWT_SECRET should be at least 32 characters long');
      } else {
        logger.log('   ✓ JWT secret length is adequate');
      }
      
      // Check for common weak secrets
      const weakSecrets = ['secret', 'jwt-secret', '123456', 'password'];
      if (weakSecrets.some(weak => jwtSecret.toLowerCase().includes(weak))) {
        issues.push('JWT_SECRET appears to contain weak/common patterns');
      } else {
        logger.log('   ✓ JWT secret appears strong');
      }
    }
    
    // 4. Check Node.js environment
    logger.log('✅ Checking Node.js environment...');
    if (process.env.NODE_ENV !== 'production') {
      warnings.push('NODE_ENV is not set to "production"');
    } else {
      logger.log('   ✓ NODE_ENV is set to production');
    }
    
    // 5. Validate database configuration
    logger.log('✅ Validating database configuration...');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        warnings.push('Database URL points to localhost - ensure this is intended for production');
      }
      if (!dbUrl.includes('ssl=true') && !dbUrl.includes('sslmode=require')) {
        warnings.push('Database connection may not be using SSL');
      }
      logger.log('   ✓ Database URL is configured');
    }
    
    // 6. Check for debug/development settings
    logger.log('✅ Checking for development settings...');
    const debugSettings = {
      'DEBUG': 'Debug logging enabled',
      'TYPEORM_LOGGING': 'Database query logging enabled',
      'SWAGGER_ENABLE': 'Swagger documentation enabled',
    };
    
    Object.entries(debugSettings).forEach(([env, description]) => {
      if (process.env[env] === 'true') {
        warnings.push(`${description} - consider disabling in production`);
      }
    });
    
    // 7. Validate security headers configuration
    logger.log('✅ Checking security configuration...');
    const securityHeaders = authSecurity.getSecurityHeaders();
    if (securityHeaders) {
      logger.log('   ✓ Security headers configuration found');
    }
    
    // 8. Check CORS configuration
    logger.log('✅ Checking CORS configuration...');
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin) {
      warnings.push('CORS_ORIGIN not set - will allow all origins');
    } else if (corsOrigin === '*') {
      issues.push('CORS_ORIGIN is set to wildcard (*) - security risk');
    } else {
      logger.log('   ✓ CORS origin is properly configured');
    }
    
    // 9. Check rate limiting configuration
    logger.log('✅ Checking rate limiting configuration...');
    const rateLimitWindow = process.env.RATE_LIMIT_WINDOW_MS;
    const rateLimitMax = process.env.RATE_LIMIT_MAX_REQUESTS;
    
    if (!rateLimitWindow || !rateLimitMax) {
      warnings.push('Rate limiting not configured - consider adding for production');
    } else {
      logger.log('   ✓ Rate limiting is configured');
    }
    
    // 10. Check SSL/HTTPS configuration
    logger.log('✅ Checking SSL configuration...');
    const httpsEnabled = process.env.HTTPS_ENABLED;
    const port = process.env.PORT;
    
    if (!httpsEnabled && port !== '443') {
      warnings.push('HTTPS not explicitly enabled - ensure SSL termination is handled by proxy');
    }
    
    // Close the application context
    await app.close();
    
    // Generate final report
    logger.log('\n🔍 PRODUCTION READINESS VALIDATION REPORT');
    logger.log('==========================================');
    
    if (issues.length === 0) {
      logger.log('✅ No critical issues found!');
    } else {
      logger.error(`❌ ${issues.length} critical issue(s) found:`);
      issues.forEach((issue, index) => {
        logger.error(`   ${index + 1}. ${issue}`);
      });
    }
    
    if (warnings.length > 0) {
      logger.warn(`⚠️  ${warnings.length} warning(s):`);
      warnings.forEach((warning, index) => {
        logger.warn(`   ${index + 1}. ${warning}`);
      });
    }
    
    // Security checklist
    logger.log('\n🔐 SECURITY CHECKLIST');
    logger.log('=====================');
    logger.log('☐ Rate limiting configured and tested');
    logger.log('☐ HTTPS/SSL certificates configured');
    logger.log('☐ Database connections use SSL');
    logger.log('☐ Social auth tokens validated with real providers');
    logger.log('☐ Password reset emails are properly sent');
    logger.log('☐ Error messages don\'t leak sensitive information');
    logger.log('☐ Audit logging is configured and monitored');
    logger.log('☐ Authentication endpoints tested under load');
    logger.log('☐ JWT tokens have appropriate expiration times');
    logger.log('☐ Account lockout mechanism tested');
    
    // Exit with appropriate code
    const exitCode = issues.length > 0 ? 1 : 0;
    logger.log(`\n${exitCode === 0 ? '✅' : '❌'} Validation completed with exit code: ${exitCode}`);
    
    if (exitCode === 0) {
      logger.log('🚀 Your application appears ready for production!');
      logger.log('   Don\'t forget to complete the security checklist above.');
    } else {
      logger.log('🛠️  Please address the critical issues before deploying to production.');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    logger.error('💥 Validation failed with error:', error);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateProductionReadiness();
}

export { validateProductionReadiness };