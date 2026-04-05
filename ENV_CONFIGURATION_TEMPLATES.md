# Environment Configuration Templates

## Frontend Production Environment (.env.production)

```env
# Frontend Production Configuration
# Last Updated: April 5, 2026

# === API CONFIGURATION ===
VITE_API_URL=https://api.synthra.com
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# === WEBSOCKET CONFIGURATION ===
VITE_WS_URL=wss://api.synthra.com/ws
VITE_WS_RECONNECT_INTERVAL=3000
VITE_WS_MAX_RECONNECT_ATTEMPTS=5

# === FEATURE FLAGS ===
VITE_ENABLE_3D=true
VITE_ENABLE_THREEJS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_AUTOMATION=true
VITE_ENABLE_ANALYTICS=true

# === PERFORMANCE ===
VITE_ENABLE_SOURCE_MAPS=false
VITE_MINIFY=true
VITE_OPTIMIZE_CHUNKS=true

# === ANALYTICS ===
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_ID=your-google-analytics-id
VITE_ENVIRONMENT=production

# === DEBUG ===
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

## Backend Production Environment (.env.production)

```env
# Backend Production Configuration
# Last Updated: April 5, 2026

# === SERVER CONFIGURATION ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# === EXTERNAL APIS ===
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=mixtral-8x7b-32768
GROQ_MAX_RETRIES=3
GROQ_TIMEOUT=30000

# === CORS CONFIGURATION ===
CORS_ORIGIN=https://synthra.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization

# === RATE LIMITING ===
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_MESSAGE=Too many requests, please try again later

# === SECURITY ===
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
SESSION_SECRET=your-session-secret-key

# === DATABASE (if using) ===
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/synthra
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# === CACHE (if using Redis) ===
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_TTL=3600

# === STORAGE ===
STORAGE_PATH=/app/storage
STORAGE_CLEANUP_INTERVAL=86400000
MAX_FILE_SIZE=52428800

# === LOGGING ===
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TO_FILE=false
LOG_FILE_PATH=/var/log/synthra.log

# === MONITORING ===
ENABLE_METRICS=true
METRICS_PORT=9090
ENABLE_HEALTH_CHECK=true

# === EMAIL (if needed) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@synthra.com

# === SENTRY ERROR TRACKING ===
SENTRY_DSN=your-sentry-dsn-here
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Frontend Development Environment (.env.development)

```env
# Frontend Development Configuration
# Last Updated: April 5, 2026

# === API CONFIGURATION ===
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=1

# === WEBSOCKET CONFIGURATION ===
VITE_WS_URL=ws://localhost:3000/ws
VITE_WS_RECONNECT_INTERVAL=1000
VITE_WS_MAX_RECONNECT_ATTEMPTS=10

# === FEATURE FLAGS ===
VITE_ENABLE_3D=true
VITE_ENABLE_THREEJS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_AUTOMATION=true
VITE_ENABLE_ANALYTICS=false

# === PERFORMANCE ===
VITE_ENABLE_SOURCE_MAPS=true
VITE_MINIFY=false
VITE_OPTIMIZE_CHUNKS=false

# === ANALYTICS ===
VITE_ANALYTICS_ENABLED=false
VITE_ENVIRONMENT=development

# === DEBUG ===
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

## Backend Development Environment (.env.development)

```env
# Backend Development Configuration
# Last Updated: April 5, 2026

# === SERVER CONFIGURATION ===
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=debug

# === EXTERNAL APIS ===
GROQ_API_KEY=your-dev-groq-api-key
GROQ_MODEL=mixtral-8x7b-32768
GROQ_MAX_RETRIES=1
GROQ_TIMEOUT=10000

# === CORS CONFIGURATION ===
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# === RATE LIMITING ===
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000

# === DATABASE ===
DATABASE_URL=mongodb://localhost:27017/synthra-dev

# === CACHE ===
REDIS_URL=redis://localhost:6379

# === STORAGE ===
STORAGE_PATH=./storage
STORAGE_CLEANUP_INTERVAL=0

# === LOGGING ===
LOG_LEVEL=debug
LOG_FORMAT=pretty

# === MONITORING ===
ENABLE_METRICS=false
ENABLE_HEALTH_CHECK=true
```

## Docker Environment (.env.docker)

```env
# Docker Container Configuration
# Last Updated: April 5, 2026

# === SERVER ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# === API ===
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000/ws

# === LOGGING ===
LOG_LEVEL=info
LOG_FORMAT=json

# === STORAGE ===
STORAGE_PATH=/app/storage

# === RATE LIMITING ===
RATE_LIMIT_MAX=100

# === DEBUG ===
VITE_DEBUG_MODE=false
```

## Setup Instructions

### 1. Frontend Setup

```bash
cd c:\Synthra\frontend

# Development
echo > .env.development
# Copy content from "Frontend Development Environment" above

# Production
echo > .env.production
# Copy content from "Frontend Production Environment" above

# Install dependencies
npm install
```

### 2. Backend Setup

```bash
cd c:\Synthra\backend

# Development
echo > .env.development
# Copy content from "Backend Development Environment" above

# Production
echo > .env.production
# Copy content from "Backend Production Environment" above

# Install dependencies
npm install
```

### 3. Load Environment Variables

#### PowerShell (Windows)

```powershell
# Function to load .env file
function Load-Env {
  param([string]$EnvFile = ".env")
  if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
      if ($_) {
        $key, $value = $_.Split('=')
        [Environment]::SetEnvironmentVariable($key, $value)
      }
    }
  }
}

# Load development
Load-Env ".env.development"

# Or production
Load-Env ".env.production"
```

#### Bash (Linux/Mac)

```bash
# Load and export
export $(cat .env.development | xargs)
npm run dev

# Or
source .env.production
npm run build:prod
```

### 4. Validate Configuration

```bash
# Check if variables are loaded
echo $VITE_API_URL

# Run build
npm run build:prod

# Start production
NODE_ENV=production npm start
```

## Security Best Practices

### ⚠️ DO NOT:
- ❌ Commit `.env.production` to git
- ❌ Share API keys publicly
- ❌ Use same secrets across environments
- ❌ Log sensitive data
- ❌ Hard-code environment variables

### ✅ DO:
- ✅ Use `.gitignore` for `.env.*`
- ✅ Rotate API keys regularly
- ✅ Use secret management (AWS Secrets, HashiCorp Vault)
- ✅ Enable HTTPS/WSS in production
- ✅ Audit environment variables monthly
- ✅ Use principle of least privilege
- ✅ Enable 2FA for API credentials

## Environment Variable Reference

### Frontend Variables

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `VITE_API_URL` | string | Backend API endpoint | `https://api.synthra.com` |
| `VITE_WS_URL` | string | WebSocket endpoint | `wss://api.synthra.com/ws` |
| `VITE_ENVIRONMENT` | string | Build environment | `production` |
| `VITE_DEBUG_MODE` | boolean | Enable debug logging | `false` |

### Backend Variables

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `NODE_ENV` | string | Node environment | `production` |
| `PORT` | number | Server port | `3000` |
| `GROQ_API_KEY` | string | Groq API authentication | `gsk_...` |
| `DATABASE_URL` | string | Database connection | `mongodb://...` |
| `RATE_LIMIT_MAX` | number | Max requests per window | `100` |

## Testing Environment Configuration

```bash
# Create test environment
cp .env.development .env.test

# Modify for testing
# - Use test database
# - Disable external APIs (use mocks)
# - Set short timeouts
# - Enable debug logging

# Run tests with environment
npm run test -- --env .env.test
```

---

**Status**: ✅ Configuration Templates Ready  
**Last Updated**: April 5, 2026
