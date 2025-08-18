# 🚀 Production Deployment Checklist

Use this checklist to ensure safe and successful production deployments of the Game Library.

## 📋 Pre-Deployment Checklist

### ✅ Environment Configuration

- [ ] **Environment Variables**: All required variables set in production `.env`
- [ ] **JWT Secret**: 64+ character cryptographically random secret
- [ ] **Database**: PostgreSQL configured (never SQLite in production)
- [ ] **Redis**: Available and configured for rate limiting
- [ ] **CORS**: Specific domain origins (never `*`)
- [ ] **File Uploads**: Appropriate size limits and allowed types
- [ ] **SSL/TLS**: HTTPS enabled and certificates valid

### ✅ Database Preparation

- [ ] **Backup**: Current database backed up
- [ ] **Migrations**: All migrations tested in staging
- [ ] **Synchronize**: Set to `false` (never `true` in production)
- [ ] **Connection**: Database credentials and connectivity verified

### ✅ Security Hardening

- [ ] **Rate Limiting**: Redis-backed rate limiting enabled
- [ ] **Authentication**: JWT configuration validated
- [ ] **Password Hashing**: BCrypt rounds set appropriately (12-14)
- [ ] **File Security**: Upload validation and size limits in place
- [ ] **API Keys**: External API keys configured securely

### ✅ Application Testing

- [ ] **Build**: Application builds without errors
- [ ] **Tests**: All unit and integration tests pass
- [ ] **Health Check**: `/health` endpoint responds correctly
- [ ] **Dependencies**: All production dependencies installed
- [ ] **Logging**: Appropriate log level set (`warn` or `error`)

## 🔧 Deployment Steps

### 1. **Backup Current System**

```bash
# Database backup
pg_dump your_production_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup (if applicable)
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/current/app
```

### 2. **Deploy Application**

```bash
# Clone/update repository
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build application
pnpm build

# Run database migrations
pnpm migration:run
```

### 3. **Start Services**

```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js

# Or using Docker
docker-compose up -d --build

# Or direct start
pnpm start
```

### 4. **Verify Deployment**

```bash
# Health check
curl https://your-domain.com/api/health

# Rate limiting check
curl https://your-domain.com/api/admin/rate-limit/health

# Application functionality
curl https://your-domain.com/api/games
```

## 🐛 Rollback Procedure

If deployment fails or issues are detected:

### **Immediate Rollback**

```bash
# 1. Stop new application
pm2 stop game-library

# 2. Restore previous application version
git checkout previous-working-commit
pnpm install --frozen-lockfile
pnpm build

# 3. Revert database if needed
pnpm migration:revert
# or restore from backup:
# psql your_db < backup_20240106_143000.sql

# 4. Restart with previous version
pm2 restart game-library
```

### **Post-Rollback Tasks**

- [ ] Verify application is working
- [ ] Check error logs for root cause
- [ ] Plan fix for next deployment
- [ ] Update team on status

## 🌍 Environment Templates

### **Production .env Template**

```bash
# Application
NODE_ENV=production
PORT=3001

# Database (PostgreSQL)
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=gamelib_prod_user
DB_PASSWORD=CHANGE_ME_SECURE_DB_PASSWORD
DB_NAME=gamelib_production
DB_SYNCHRONIZE=false

# Redis
REDIS_URL=redis://your-redis-host:6379
RATE_LIMIT_REDIS_ENABLED=true

# Security
JWT_SECRET=CHANGE_ME_64_CHAR_MINIMUM_CRYPTOGRAPHICALLY_RANDOM_JWT_SECRET
CORS_ORIGIN=https://your-production-domain.com
BCRYPT_ROUNDS=14

# File Uploads
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=2147483648
ALLOWED_FILE_TYPES=.zip,.rar,.7z,.tar.gz

# External APIs
STEAM_API_KEY=your_production_steam_key
IGDB_CLIENT_ID=your_production_igdb_id
IGDB_CLIENT_SECRET=your_production_igdb_secret
RAWG_API_KEY=your_production_rawg_key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME_SECURE_ADMIN_PASSWORD

# Logging
LOG_LEVEL=warn
```

### **Docker Compose Production**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gamelib_production
      POSTGRES_USER: gamelib_prod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  app:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - uploads:/app/uploads

volumes:
  postgres_data:
  redis_data:
  uploads:
```

## 📊 Monitoring & Maintenance

### **Health Monitoring**

- [ ] Application health endpoint: `/api/health`
- [ ] Database connectivity monitoring
- [ ] Redis connectivity monitoring
- [ ] Rate limiting statistics: `/api/admin/rate-limit/stats`
- [ ] Error rate monitoring
- [ ] Response time monitoring

### **Log Monitoring**

```bash
# Application logs
pm2 logs game-library

# Database logs
tail -f /var/log/postgresql/postgresql.log

# System logs
journalctl -u game-library -f
```

### **Regular Maintenance**

- [ ] **Weekly**: Review error logs and performance metrics
- [ ] **Monthly**: Update dependencies (with testing)
- [ ] **Quarterly**: Review and update environment configurations
- [ ] **Quarterly**: Database maintenance (analyze, vacuum, reindex)

## 🚨 Emergency Contacts

### **Escalation Path**

1. **Development Team**: [contact info]
2. **DevOps Team**: [contact info]
3. **Database Administrator**: [contact info]
4. **On-call Engineer**: [contact info]

### **Critical Resources**

- **Monitoring Dashboard**: [URL]
- **Error Tracking**: [URL]
- **Database Admin Panel**: [URL]
- **Documentation**: [URL]

---

## 📝 Deployment Log Template

```
Deployment Date: ___________
Deployed By: _______________
Git Commit: _______________
Environment: Production

Pre-deployment Checklist: ✅ Complete
Backup Created: ✅ backup_YYYYMMDD_HHMMSS.sql
Migration Status: ✅ X migrations applied
Health Check: ✅ All endpoints responding
Post-deployment Testing: ✅ Complete

Issues Encountered: ________________
Resolution: _______________________
Rollback Required: ❌ No / ✅ Yes

Sign-off: _________________________
```

Remember: **Always test in staging first!** 🧪
