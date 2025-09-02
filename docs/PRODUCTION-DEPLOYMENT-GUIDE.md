# Production Deployment Guide - JWT Authentication

## 🚀 Production-Ready Authentication System

This guide covers the complete setup and deployment of the JWT authentication system with social login support, designed for production environments.

## 📋 Features Implemented

### ✅ Core Authentication
- **JWT Token-based Authentication** with secure HS256 algorithm
- **Password Security** with bcrypt hashing (12 salt rounds)
- **Account Lockout** mechanism (5 failed attempts, 30min lockout)
- **Rate Limiting** on all auth endpoints
- **Input Sanitization** and validation
- **Comprehensive Logging** for security events

### ✅ Social Authentication
- **Google OAuth 2.0** with token validation
- **Facebook Login** with debug token verification
- **Apple Sign In** with JWT token validation
- **Microsoft Account** with Graph API verification
- **Real-time Token Validation** against provider APIs
- **Account Linking** for existing users

### ✅ Security Features
- **Password Strength Validation** (8+ chars, uppercase, lowercase, numbers, symbols)
- **Failed Attempt Tracking** with automatic lockout
- **Security Event Logging** for audit trails
- **Token Caching** with TTL for performance
- **Environment Validation** for production readiness
- **CORS Protection** with configurable origins
- **Security Headers** (HSTS, CSP, XSS Protection, etc.)

### ✅ Production Enhancements
- **Comprehensive Error Handling** without information disclosure
- **TypeScript Type Safety** throughout the codebase
- **Integration Tests** for all endpoints
- **Production Validation Script** for deployment readiness
- **Performance Optimizations** for high-load scenarios

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database?ssl=true

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_EXPIRES_IN=15m

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# Security Configuration
HTTPS_ENABLED=true
BCRYPT_ROUNDS=12
```

### Social Provider Configuration

```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook Login
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Apple Sign In
APPLE_CLIENT_ID=your-apple-client-id
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id

# Microsoft Account
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## 🏗️ Deployment Steps

### 1. Pre-deployment Validation

```bash
# Run the production readiness validator
npm run validate:production

# Run all tests
npm run test
npm run test:e2e

# Security audit
npm audit --audit-level moderate
```

### 2. Database Migration

```bash
# Generate migration for new auth fields
npm run migration:generate -- --name=add-social-auth-fields

# Run migrations
npm run migration:run

# Verify database schema
npm run migration:show
```

### 3. Build and Deploy

```bash
# Production build
npm run build

# Start production server
npm run start:prod

# Or with PM2 for process management
pm2 start ecosystem.config.js --env production
```

### 4. Post-deployment Verification

```bash
# Health check
curl -X GET https://yourdomain.com/health

# Test authentication endpoints
curl -X POST https://yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'

# Test social auth (with valid token)
curl -X POST https://yourdomain.com/auth/social \
  -H "Content-Type: application/json" \
  -d '{
    "provider":"google",
    "access_token":"valid-google-token",
    "user_info":{"email":"user@gmail.com","name":"User Name","sub":"123"}
  }'
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup
- Enable HTTPS with valid SSL certificates
- Configure HSTS headers for security
- Use secure ciphers and protocols

### 2. Reverse Proxy Configuration

#### Nginx Example
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw enable
```

## 📊 Monitoring and Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Application logs
pm2 logs your-app-name --lines 100

# Error tracking
tail -f /var/log/your-app/error.log
```

### 2. Security Event Monitoring
The application logs all security events. Set up alerts for:
- Multiple failed login attempts
- Account lockouts
- Invalid social auth tokens
- Suspicious activity patterns

### 3. Performance Monitoring
Monitor these key metrics:
- Authentication response times
- Database connection pool usage
- Memory and CPU usage
- Request rate and error rates

## 🧪 Testing Production Setup

### 1. Load Testing
```bash
# Install artillery
npm install -g artillery

# Test authentication endpoints
artillery run load-test-auth.yml
```

### 2. Security Testing
```bash
# Test rate limiting
for i in {1..20}; do
  curl -X POST https://yourdomain.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' &
done

# Test CORS
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     https://yourdomain.com/auth/login
```

### 3. Social Auth Testing
Test each social provider with real tokens:
- Google: Use OAuth 2.0 Playground
- Facebook: Use Graph API Explorer
- Apple: Use developer console
- Microsoft: Use Graph Explorer

## 🔄 Maintenance and Updates

### 1. Regular Security Updates
```bash
# Weekly security audit
npm audit
npm update

# Check for dependency vulnerabilities
npm run security:check
```

### 2. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/your-app

# Example configuration
/var/log/your-app/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 your-app your-app
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Database Maintenance
```bash
# Weekly database maintenance
npm run db:analyze
npm run db:vacuum

# Backup authentication data
pg_dump -h localhost -U user -d database -t users -t sessions > auth_backup.sql
```

## 📈 Performance Optimization

### 1. Database Indexing
```sql
-- Ensure proper indexes for auth queries
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY idx_users_social_id ON users(social_provider, social_id);
```

### 2. Caching Strategy
- Redis for session storage
- Cache social token validations
- Cache user profile data

### 3. Rate Limiting Optimization
- Implement distributed rate limiting for multiple instances
- Use Redis for shared rate limit state
- Configure sliding window rate limiting

## 🚨 Incident Response

### 1. Security Incident Response
1. **Identify** the threat (monitor logs for suspicious patterns)
2. **Contain** the threat (temporary lockouts, IP blocking)
3. **Investigate** the scope and impact
4. **Respond** with appropriate measures
5. **Recover** normal operations
6. **Learn** and improve security measures

### 2. Common Issues and Solutions

#### High Failed Login Rate
```bash
# Check for brute force attacks
grep "LOGIN_FAILED" /var/log/your-app/security.log | tail -100

# Temporarily block suspicious IPs
ufw insert 1 deny from [suspicious-ip]
```

#### Social Auth Failures
```bash
# Check provider API status
curl -I https://www.googleapis.com/oauth2/v1/tokeninfo
curl -I https://graph.facebook.com/debug_token

# Verify provider credentials
npm run social:validate-config
```

## ✅ Production Readiness Checklist

- [ ] All environment variables configured
- [ ] JWT secret is strong and unique
- [ ] Database migrations completed
- [ ] SSL certificates installed and valid
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled and tested
- [ ] Social provider credentials configured
- [ ] Security headers enabled
- [ ] Monitoring and alerting configured
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Incident response plan documented

## 📞 Support and Troubleshooting

For production issues, check:
1. Application logs (`pm2 logs`)
2. System logs (`journalctl -u your-app`)
3. Database logs
4. Security event logs

Common troubleshooting commands:
```bash
# Check application health
npm run health:check

# Validate production configuration
npm run validate:production

# Test database connectivity
npm run db:test-connection

# Verify JWT configuration
npm run auth:test-jwt
```

---

**Remember**: Security is an ongoing process. Regularly review and update your authentication system, monitor for threats, and stay informed about security best practices.

🔐 **Your authentication system is now production-ready with enterprise-grade security features!**