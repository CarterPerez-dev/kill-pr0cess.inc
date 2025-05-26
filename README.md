# 1. Clone and setup
git clone kill-pr0cess.inc.git
cd kill-pr0cess.inc

# 2. Copy environment file
cp .env.example .env

# Edit .env with GitHub token and other settings

# 3. Start development environment
docker-compose build && docker-compose up -d

# 4. Install frontend dependencies
cd frontend && npm install

# 5. Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 6. Run database migrations
cd backend && sqlx migrate run

# 7. Start development servers

# Terminal 1: Backend
cd backend && cargo run

# Terminal 2: Frontend  
cd frontend && npm run dev

# 8. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Prometheus: http://localhost:9090
