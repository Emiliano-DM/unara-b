# Unara Travel Planning API - Production Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the Unara Travel Planning API to production environments. The application is designed to be cloud-native and supports various deployment strategies.

## 📋 Prerequisites

### Infrastructure Requirements
- **Node.js Runtime**: v18.x or higher
- **Database**: PostgreSQL 13+ with connection pooling
- **Load Balancer**: Nginx, AWS ALB, or equivalent
- **SSL Certificate**: For HTTPS termination
- **Monitoring**: Application and infrastructure monitoring tools

### Access Requirements
- Production server SSH access or container orchestration access
- Database administrator credentials
- Domain name and DNS management access
- SSL certificate management access

## 🏗 Infrastructure Architecture

### Recommended Production Architecture
```
Internet
    ↓
Load Balancer (SSL Termination)
    ↓
API Gateway / Reverse Proxy
    ↓
Unara API Instances (2+ for HA)
    ↓
PostgreSQL Database (Primary/Replica)
```

### Security Components
- **WAF (Web Application Firewall)**: Filter malicious requests
- **Rate Limiting**: Application-level and infrastructure-level
- **Network Security**: VPC, Security Groups, Firewalls
- **Secret Management**: AWS Secrets Manager, HashiCorp Vault, etc.

## 🔧 Pre-Deployment Setup

### 1. Database Preparation

#### Production Database Setup
```sql
-- Create production database
CREATE DATABASE unara_production;

-- Create application user
CREATE USER unara_api WITH PASSWORD 'secure-random-password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE unara_production TO unara_api;
GRANT USAGE ON SCHEMA public TO unara_api;
GRANT CREATE ON SCHEMA public TO unara_api;

-- For read replica (optional)
CREATE USER unara_readonly WITH PASSWORD 'secure-readonly-password';
GRANT CONNECT ON DATABASE unara_production TO unara_readonly;
GRANT USAGE ON SCHEMA public TO unara_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO unara_readonly;
```

#### Connection Pooling Configuration
```bash
# PostgreSQL connection pooling (recommended: PgBouncer)
# Example pgbouncer.ini
[databases]
unara_production = host=db-host port=5432 dbname=unara_production

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
```

### 2. Environment Configuration

#### Production Environment Variables
Create `/etc/unara-api/.env`:
```bash
# Application Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=unara_production
DB_USERNAME=unara_api
DB_PASSWORD=your-secure-db-password

# Database Connection Pool
DB_CONNECTION_TIMEOUT=10000
DB_POOL_MIN=5
DB_POOL_MAX=20

# JWT Configuration
JWT_SECRET=your-256-bit-production-jwt-secret-key-here
JWT_EXPIRES_IN=15m

# Security Configuration
CORS_ORIGINS=https://your-frontend-domain.com,https://admin.your-domain.com
RATE_LIMIT_TTL=60000
RATE_LIMIT_REQUESTS=100

# Monitoring and Logging
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090

# External Services
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

#### Security Best Practices
```bash
# Set proper file permissions
chmod 600 /etc/unara-api/.env
chown unara-api:unara-api /etc/unara-api/.env

# Use secret management service (example with AWS)
# Store sensitive values in AWS Secrets Manager
# Reference them in your deployment scripts
```

## 🚀 Deployment Methods

### Method 1: Traditional Server Deployment

#### 1. Prepare Application
```bash
# On your deployment server
git clone [your-repository-url] /opt/unara-api
cd /opt/unara-api

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Create application user
useradd -r -s /bin/false unara-api
chown -R unara-api:unara-api /opt/unara-api
```

#### 2. Database Migration
```bash
# Run database migrations
NODE_ENV=production npm run migration:run

# Verify migration success
NODE_ENV=production npm run migration:show
```

#### 3. Process Management (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'unara-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/unara-api/error.log',
    out_file: '/var/log/unara-api/out.log',
    log_file: '/var/log/unara-api/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: ['--max-old-space-size=1024']
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/unara-api
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }
}
```

### Method 2: Docker Deployment

#### 1. Create Production Dockerfile
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S unara-api -u 1001

# Set working directory
WORKDIR /app

# Copy application files
COPY --from=builder --chown=unara-api:nodejs /app/node_modules ./node_modules
COPY --chown=unara-api:nodejs dist ./dist
COPY --chown=unara-api:nodejs package*.json ./

# Security: Run as non-root user
USER unara-api

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node dist/health-check.js || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### 2. Docker Compose for Production
```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile.production
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
    networks:
      - unara-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: unara_production
      POSTGRES_USER: unara_api
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    secrets:
      - postgres_password
    networks:
      - unara-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - unara-network

volumes:
  postgres_data:

secrets:
  postgres_password:
    external: true

networks:
  unara-network:
    driver: bridge
```

### Method 3: Kubernetes Deployment

#### 1. Kubernetes Manifests
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unara-api
  labels:
    app: unara-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: unara-api
  template:
    metadata:
      labels:
        app: unara-api
    spec:
      containers:
      - name: unara-api
        image: your-registry/unara-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: unara-api-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: unara-api-service
spec:
  selector:
    app: unara-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

## 📊 Monitoring and Observability

### 1. Health Check Endpoint
Create `src/health/health.controller.ts`:
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      checks: {
        database: checks[0],
        memory: checks[1],
      }
    };

    return health;
  }

  private async checkDatabase() {
    try {
      await this.databaseService.query('SELECT 1');
      return { status: 'up', responseTime: Date.now() };
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }

  private checkMemory() {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    };
  }
}
```

### 2. Logging Configuration
```typescript
// main.ts production logging setup
import { Logger } from '@nestjs/common';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

app.useLogger(logger);
```

### 3. Metrics Collection
```typescript
// Install: npm install @prometheus-io/client
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
});

// Metrics endpoint
@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    return register.metrics();
  }
}
```

## 🔄 Deployment Pipeline

### 1. Pre-deployment Checklist
- [ ] All tests pass (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup procedures tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

### 2. Deployment Steps
```bash
#!/bin/bash
# deployment.sh

set -e

echo "🚀 Starting Unara API Deployment"

# 1. Backup current database
echo "📦 Creating database backup..."
pg_dump $DB_CONNECTION_STRING > backups/pre-deployment-$(date +%Y%m%d-%H%M%S).sql

# 2. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 3. Install dependencies
echo "📋 Installing dependencies..."
npm ci --only=production

# 4. Run tests
echo "🧪 Running tests..."
npm run test

# 5. Build application
echo "🔨 Building application..."
npm run build

# 6. Run database migrations
echo "🗃  Running database migrations..."
npm run migration:run

# 7. Restart application
echo "🔄 Restarting application..."
pm2 reload ecosystem.config.js --env production

# 8. Health check
echo "🏥 Performing health check..."
sleep 10
curl -f http://localhost:3000/health || exit 1

# 9. Warm up application
echo "🔥 Warming up application..."
curl -s http://localhost:3000/api/docs > /dev/null

echo "✅ Deployment completed successfully!"
```

### 3. Rollback Procedure
```bash
#!/bin/bash
# rollback.sh

set -e

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./rollback.sh <backup-file>"
  exit 1
fi

echo "⏪ Starting rollback procedure"

# 1. Stop application
pm2 stop unara-api

# 2. Restore database
echo "🗃  Restoring database..."
psql $DB_CONNECTION_STRING < $BACKUP_FILE

# 3. Revert to previous version
echo "📦 Reverting code..."
git checkout HEAD~1

# 4. Reinstall dependencies
npm ci --only=production

# 5. Rebuild
npm run build

# 6. Restart application
pm2 start unara-api

echo "✅ Rollback completed"
```

## 🛡 Security Configuration

### 1. Production Security Headers
```typescript
// security.middleware.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 2. Rate Limiting Configuration
```typescript
// Enhanced rate limiting for production
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000,
      }
    ])
  ],
})
```

### 3. Input Validation
```typescript
// Global validation pipe with production settings
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }),
);
```

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_trips_owner_id ON trips(owner_id);
CREATE INDEX CONCURRENTLY idx_trips_status ON trips(status);
CREATE INDEX CONCURRENTLY idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Analyze table statistics
ANALYZE trips, users, trip_participants, items, luggage;
```

### 2. Application Performance
```typescript
// Connection pooling configuration
TypeOrmModule.forRoot({
  // ... other config
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  },
});
```

### 3. Caching Strategy
```typescript
// Redis caching for frequently accessed data
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get(key);
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.cacheManager.set(key, value, { ttl });
  }
}
```

## 🚨 Troubleshooting

### Common Production Issues

#### 1. High Memory Usage
```bash
# Monitor memory usage
htop
# or
pm2 monit

# Analyze heap dumps
node --inspect dist/main.js
# Connect Chrome DevTools to analyze memory leaks
```

#### 2. Database Connection Issues
```bash
# Check database connections
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

# Monitor connection pool
SELECT * FROM pg_stat_database WHERE datname = 'unara_production';
```

#### 3. Slow API Responses
```bash
# Monitor API response times
tail -f /var/log/nginx/access.log | grep -E '[0-9]+\.[0-9]+$'

# Database slow query log
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Emergency Procedures

#### 1. Application Unresponsive
```bash
# Quick restart
pm2 restart unara-api

# If still unresponsive, force restart
pm2 kill
pm2 resurrect
```

#### 2. Database Issues
```bash
# Check database status
systemctl status postgresql

# Emergency read-only mode
ALTER DATABASE unara_production SET default_transaction_read_only = on;
```

#### 3. High Load
```bash
# Scale horizontally (with load balancer)
pm2 scale unara-api +2

# Temporary rate limiting
# Update nginx configuration to be more restrictive
```

## 📋 Maintenance Tasks

### Daily Tasks
- [ ] Check application logs for errors
- [ ] Verify backup completion
- [ ] Monitor resource utilization
- [ ] Check SSL certificate expiration

### Weekly Tasks
- [ ] Review security logs
- [ ] Update dependencies (security patches)
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Performance metrics analysis

### Monthly Tasks
- [ ] Security audit
- [ ] Capacity planning review
- [ ] Disaster recovery test
- [ ] Update documentation

## 📞 Emergency Contacts

In case of production issues:

- **On-call Developer**: [contact-info]
- **Database Administrator**: [contact-info]
- **DevOps/Infrastructure**: [contact-info]
- **Security Team**: [contact-info]

---

**🎯 This deployment guide ensures a robust, secure, and scalable production environment for the Unara Travel Planning API.**