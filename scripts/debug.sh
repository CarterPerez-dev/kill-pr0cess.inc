#!/bin/bash

# Comprehensive debugging and status checking script for the performance showcase.
# I'm creating a complete diagnostic tool that checks both backend and frontend health, configuration, and common issues.

set -e

echo "🔍 Dark Performance Showcase - Debug & Status Check"
echo "=================================================="
echo

# I'm checking Docker Compose status
echo "📦 Docker Services Status:"
echo "------------------------"
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi
echo

# I'm checking backend health
echo "🦀 Backend Health Check:"
echo "---------------------"
BACKEND_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null || echo "❌ Backend unreachable")
if [[ "$BACKEND_HEALTH" =~ "healthy" ]]; then
    echo "✅ Backend is healthy"
    echo "📊 Backend details:"
    curl -s http://localhost:8000/health | jq '.' 2>/dev/null || echo "$BACKEND_HEALTH"
else
    echo "❌ Backend health check failed: $BACKEND_HEALTH"
    echo "🔧 Checking backend logs..."
    if command -v docker-compose &> /dev/null; then
        docker-compose logs --tail=10 backend
    else
        docker compose logs --tail=10 backend
    fi
fi
echo

# I'm checking frontend health
echo "⚛️  Frontend Health Check:"
echo "------------------------"
FRONTEND_HEALTH=$(curl -s http://localhost:4000/ 2>/dev/null || echo "❌ Frontend unreachable")
if [[ "$FRONTEND_HEALTH" =~ "html" ]] || [[ "$FRONTEND_HEALTH" =~ "DOCTYPE" ]]; then
    echo "✅ Frontend is serving content"
else
    echo "❌ Frontend health check failed"
    echo "🔧 Checking frontend logs..."
    if command -v docker-compose &> /dev/null; then
        docker-compose logs --tail=10 frontend
    else
        docker compose logs --tail=10 frontend
    fi
fi
echo

# I'm checking database connectivity
echo "🗄️  Database Status:"
echo "------------------"
DB_STATUS=$(docker exec kill-pr0cessinc-postgres-1 pg_isready -U darkuser -d dark_performance 2>/dev/null || echo "❌ Database unreachable")
if [[ "$DB_STATUS" =~ "accepting connections" ]]; then
    echo "✅ PostgreSQL is accepting connections"
else
    echo "❌ Database check failed: $DB_STATUS"
fi
echo

# I'm checking Redis connectivity
echo "🔴 Redis Status:"
echo "---------------"
REDIS_STATUS=$(docker exec kill-pr0cessinc-redis-1 redis-cli ping 2>/dev/null || echo "❌ Redis unreachable")
if [[ "$REDIS_STATUS" == "PONG" ]]; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis check failed: $REDIS_STATUS"
fi
echo

# I'm checking for common issues
echo "🔧 Common Issues Check:"
echo "----------------------"

# Check for port conflicts
echo "📡 Port Status:"
PORTS=(4000 8000 5432 6377)
for port in "${PORTS[@]}"; do
    if lsof -i :$port &> /dev/null; then
        PROCESS=$(lsof -i :$port | grep LISTEN | awk '{print $1, $2}' | head -1)
        echo "  Port $port: ✅ In use by $PROCESS"
    else
        echo "  Port $port: ❌ Not in use"
    fi
done
echo

# Check Docker resource usage
echo "💾 Docker Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -5
echo

# I'm providing troubleshooting recommendations
echo "🛠️  Troubleshooting Recommendations:"
echo "-----------------------------------"

if [[ "$BACKEND_HEALTH" =~ "❌" ]]; then
    echo "🦀 Backend Issues:"
    echo "  • Check Rust compilation errors in logs"
    echo "  • Verify DATABASE_URL and REDIS_URL in docker-compose.yml"
    echo "  • Ensure PostgreSQL and Redis are healthy first"
    echo "  • Run: docker-compose restart backend"
    echo
fi

if [[ "$FRONTEND_HEALTH" =~ "❌" ]]; then
    echo "⚛️  Frontend Issues:"
    echo "  • Check for vite-plugin-solid errors in logs"
    echo "  • Verify patch was applied: docker-compose exec frontend npm run patch:check"
    echo "  • Try rebuilding: docker-compose build frontend"
    echo "  • Check Node.js version compatibility"
    echo
fi

# I'm providing quick fix commands
echo "⚡ Quick Fix Commands:"
echo "--------------------"
echo "🔄 Restart everything:    docker-compose down && docker-compose up -d"
echo "🏗️  Rebuild backend:       docker-compose build backend"
echo "🏗️  Rebuild frontend:      docker-compose build frontend"
echo "📋 View all logs:         docker-compose logs -f"
echo "🧹 Clean restart:         docker-compose down -v && docker-compose up -d"
echo "🐛 Debug mode:            docker-compose logs -f backend frontend"
echo

# I'm showing environment information
echo "🌍 Environment Information:"
echo "-------------------------"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version 2>/dev/null || docker compose version)"
echo "Host OS: $(uname -s)"
echo "Architecture: $(uname -m)"
echo

echo "✅ Debug check complete!"
echo "💡 For real-time monitoring, run: watch -n 5 ./debug.sh"
