# 🚀 R-Mart Deployment Checklist

## ✅ Completed (Already Fixed)
- [x] **CORS Configuration** - Fixed hardcoded localhost in `backend/server.js`
- [x] **Socket.IO CORS** - Fixed hardcoded localhost in `backend/socket/socket.js`  
- [x] **Frontend API Proxy** - Made configurable in `frontend/next.config.js`
- [x] **Production Logging** - Morgan now uses appropriate format for production
- [x] **Environment Templates** - Created `env.production.example` files

## 🔧 Before Containerization

### 1. Clean Up Console Logging
```bash
# Search for console.log statements that should be removed/replaced
grep -r "console\." backend/ frontend/ --exclude-dir=node_modules
```
**Action:** Remove debug console.logs, keep only essential error logging

### 2. Environment Variables Setup
**Backend** (`backend/.env`):
```bash
cp backend/env.production.example backend/.env
# Then fill in your actual values
```

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/env.production.example frontend/.env.local  
# Then fill in your actual values
```

### 3. Generate Required Security Keys
```bash
# Generate encryption key
cd backend && node scripts/generateEncryptionKey.js

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Database Migration Strategy
**Current Issue:** `initDB()` runs migrations on every startup

**Options:**
1. **Keep as-is** (simpler, good for smaller deployments)
2. **Separate migration script** (recommended for production)

If choosing option 2:
- Move `initDB()` to a separate migration script
- Run migrations separately before deployment
- Remove database initialization from `server.js`

### 5. Frontend Production Build Test
```bash
cd frontend
npm run build
npm run start
```
Verify the build works without errors.

## 🐳 Docker Preparation

### 6. Create Dockerfile for Backend
**File:** `backend/Dockerfile`
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 7. Create Dockerfile for Frontend
**File:** `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3001
CMD ["npm", "start"]
```

### 8. Create Docker Compose
**File:** `docker-compose.yml`
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      
  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    env_file:
      - ./frontend/.env.local
    depends_on:
      - backend
      
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rmart
      POSTGRES_USER: ${PGUSER}
      POSTGRES_PASSWORD: ${PGPASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 9. Create .dockerignore Files
**Backend** (`backend/.dockerignore`):
```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
```

**Frontend** (`frontend/.dockerignore`):
```
node_modules
npm-debug.log
.env.local
.git
.gitignore
README.md
.next
```

## 🔍 Final Verification

### 10. Test Environment Variables
Verify all required environment variables are set:
- `CLIENT_URL` points to your production frontend domain
- `NEXT_PUBLIC_API_URL` points to your production backend domain
- Database credentials are correct
- AWS S3 credentials are configured
- Security keys are properly generated

### 11. Security Checklist
- [ ] All secrets stored in environment variables
- [ ] CORS configured for production domain
- [ ] Helmet security headers enabled
- [ ] JWT secret is secure and unique
- [ ] Database uses SSL connections
- [ ] Rate limiting properly configured (Arcjet)

### 12. Performance Checklist
- [ ] Frontend builds without warnings
- [ ] Database queries are optimized
- [ ] Static assets properly configured
- [ ] Elasticsearch properly configured (if used)

## 🎯 Production Deployment Notes

1. **Database**: Consider using managed database service (AWS RDS, Neon, etc.)
2. **File Storage**: Ensure S3 bucket permissions are correct
3. **SSL**: Configure HTTPS for both frontend and backend
4. **Domain**: Set up proper domain names and DNS
5. **Monitoring**: Consider adding logging/monitoring services
6. **Backup**: Set up database backup strategy

## ❗ Critical Environment Variables

**Must be set for production:**
```bash
# Backend
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
PGHOST=your-db-host
PGDATABASE=your-db-name
PGUSER=your-db-user
PGPASSWORD=your-db-password

# Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

**Next Step:** After completing this checklist, you'll be ready to containerize with Docker and deploy to your chosen platform!
