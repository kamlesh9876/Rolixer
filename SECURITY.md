# Security Policy

## Overview

This document outlines the security measures implemented in the Rolixer platform and provides guidelines for maintaining security.

## Security Measures Implemented

### 🔐 Authentication & Authorization

- **JWT Authentication**: Secure token-based authentication with configurable expiration
- **Password Hashing**: bcrypt with salt for secure password storage
- **Role-Based Access Control**: USER, CUSTOMER, STORE_OWNER, ADMIN roles
- **Rate Limiting**: 5 requests per 15 minutes on authentication endpoints
- **No Default Secrets**: JWT_SECRET must be provided via environment variables

### 🛡️ Security Headers

**Backend Security Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

**Frontend Security Headers:**
- Content Security Policy (CSP) configured
- Same security headers as backend
- NGINX configuration for production deployment

### 🔒 Data Protection

- **Input Validation**: class-validator decorators on all DTOs
- **SQL Injection Prevention**: TypeORM parameterized queries
- **XSS Prevention**: DOMPurify for input sanitization
- **CORS Configuration**: Restricted to specific frontend origins
- **Database Security**: Production synchronize disabled

### 🚨 Infrastructure Security

- **Docker Containers**: Non-root user execution
- **Environment Variables**: Secure configuration management
- **CI/CD Security Scanning**: Automated vulnerability detection
- **Dependency Auditing**: Regular npm audit checks

## Environment Variables

### Required Environment Variables

**Backend (.env):**
```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=rolixer
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_db_password

# JWT Configuration (CRITICAL - MUST BE SET)
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```bash
REACT_APP_API_URL=http://localhost:3001
```

### Security Requirements

1. **JWT_SECRET**: Must be at least 32 characters, cryptographically secure
2. **Database Passwords**: Use strong, unique passwords
3. **Environment Separation**: Different secrets for dev/staging/production

## Node.js Version Requirements

**CRITICAL**: This project requires Node.js ≥18.0.0

### Current Issues with Node.js v12.22.12:
- Jest v30 incompatible (requires Node.js ≥18)
- Modern security packages incompatible
- Frontend vulnerabilities persist due to old Node.js
- React Scripts and build tools require newer Node.js

### Upgrade Instructions:
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
# https://nodejs.org/en/download/

# Verify installation
node --version  # Should show v18.x.x or higher
```

## Security Vulnerabilities

### Resolved Issues ✅
- JWT hardcoded secret fallback removed
- TypeORM deprecated methods updated to DataSource API
- Rate limiting implemented on auth endpoints
- Security headers configured
- Database synchronize disabled in production

### Known Issues ⚠️
- **Frontend Dependencies**: 9 npm vulnerabilities due to Node.js v12 incompatibility
- **Testing Framework**: Jest not functional due to Node.js version
- **Package Updates**: Many packages require Node.js ≥14/16/18

### Mitigation Steps:
1. **Immediate**: Upgrade Node.js to version 18+
2. **After Upgrade**: Run `npm audit fix` in both backend and frontend
3. **Verification**: Run full test suite and security scans

## Deployment Security

### Docker Security
- Non-root user execution in containers
- Multi-stage builds for minimal attack surface
- Security headers in NGINX configuration
- Network isolation with Docker networks

### Production Checklist
- [ ] JWT_SECRET set to secure value (≥32 chars)
- [ ] Database credentials secured
- [ ] HTTPS enabled with valid certificates
- [ ] Rate limiting configured
- [ ] Security headers verified
- [ ] Node.js version ≥18
- [ ] All dependencies updated
- [ ] npm audit shows 0 vulnerabilities

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [security@rolixer.com]
3. Include detailed description and reproduction steps
4. Allow reasonable time for response and fix

## Security Monitoring

### Automated Checks
- CI/CD pipeline runs security audits on every commit
- Dependency vulnerability scanning
- Docker image security scanning
- Code quality and security linting

### Manual Reviews
- Regular security audits recommended
- Penetration testing for production deployments
- Code reviews for security-sensitive changes

## Compliance

This security implementation follows:
- OWASP Top 10 security practices
- Node.js security best practices
- Docker security guidelines
- JWT security recommendations

## Updates

This security policy is reviewed and updated regularly. Last updated: 2025-08-30

For questions about security measures, contact the development team.