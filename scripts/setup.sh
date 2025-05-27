#!/bin/bash

# Comprehensive development environment setup script for the performance showcase with intelligent dependency detection.
# I'm implementing automated environment setup with system detection, dependency installation, and validation to ensure optimal development experience.

set -euo pipefail

# Color codes for enhanced output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly LOG_FILE="$PROJECT_ROOT/setup.log"

# Requirements
readonly MIN_NODE_VERSION="20"
readonly MIN_DOCKER_VERSION="24"
readonly MIN_DOCKER_COMPOSE_VERSION="2.20"
readonly REQUIRED_RUST_VERSION="1.75"

# I'm setting up logging and error handling
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $*${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $*${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $*${NC}"
}

# I'm detecting the operating system for platform-specific setup
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            echo "ubuntu"
        elif command -v yum &> /dev/null; then
            echo "centos"
        elif command -v pacman &> /dev/null; then
            echo "arch"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# I'm checking if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# I'm comparing version numbers
version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# I'm installing system dependencies based on the detected OS
install_system_dependencies() {
    local os=$(detect_os)

    log "Installing system dependencies for $os..."

    case $os in
        "ubuntu")
            sudo apt-get update
            sudo apt-get install -y \
                curl \
                wget \
                git \
                build-essential \
                pkg-config \
                libssl-dev \
                libpq-dev \
                postgresql-client \
                redis-tools \
                jq \
                htop \
                ca-certificates \
                gnupg \
                lsb-release
            ;;
        "macos")
            if ! command_exists brew; then
                warn "Homebrew not found. Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi

            brew update
            brew install \
                curl \
                wget \
                git \
                postgresql \
                redis \
                jq \
                htop
            ;;
        "centos")
            sudo yum update -y
            sudo yum groupinstall -y "Development Tools"
            sudo yum install -y \
                curl \
                wget \
                git \
                openssl-devel \
                postgresql-devel \
                redis \
                jq
            ;;
        *)
            warn "Unknown OS: $os. Please install dependencies manually."
            return 1
            ;;
    esac

    success "System dependencies installed"
}

# I'm installing Rust with the required version
install_rust() {
    log "Checking Rust installation..."

    if command_exists rustc; then
        local current_version=$(rustc --version | awk '{print $2}')
        if version_ge "$current_version" "$REQUIRED_RUST_VERSION"; then
            success "Rust $current_version is already installed (>= $REQUIRED_RUST_VERSION)"
            return 0
        else
            warn "Rust $current_version is installed but version $REQUIRED_RUST_VERSION is required"
        fi
    fi

    log "Installing Rust $REQUIRED_RUST_VERSION..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain $REQUIRED_RUST_VERSION
    source "$HOME/.cargo/env"

    # I'm installing additional Rust components
    rustup component add rustfmt clippy
    rustup target add x86_64-unknown-linux-musl || true

    success "Rust installed successfully"
}

# I'm installing Node.js and npm
install_nodejs() {
    log "Checking Node.js installation..."

    if command_exists node; then
        local current_version=$(node --version | sed 's/v//')
        local major_version=$(echo "$current_version" | cut -d. -f1)

        if [[ $major_version -ge $MIN_NODE_VERSION ]]; then
            success "Node.js v$current_version is already installed (>= v$MIN_NODE_VERSION)"
            return 0
        else
            warn "Node.js v$current_version is installed but v$MIN_NODE_VERSION is required"
        fi
    fi

    log "Installing Node.js $MIN_NODE_VERSION..."

    # I'm using Node Version Manager for flexible Node.js management
    if ! command_exists nvm; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi

    nvm install $MIN_NODE_VERSION
    nvm use $MIN_NODE_VERSION
    nvm alias default $MIN_NODE_VERSION

    # I'm updating npm to the latest version
    npm install -g npm@latest

    success "Node.js installed successfully"
}

# I'm installing Docker and Docker Compose
install_docker() {
    log "Checking Docker installation..."

    local docker_ok=false
    local compose_ok=false

    if command_exists docker; then
        local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        local docker_major=$(echo "$docker_version" | cut -d. -f1)

        if [[ $docker_major -ge $MIN_DOCKER_VERSION ]]; then
            success "Docker $docker_version is already installed (>= $MIN_DOCKER_VERSION)"
            docker_ok=true
        fi
    fi

    if command_exists docker && docker compose version &> /dev/null; then
        local compose_version=$(docker compose version --short 2>/dev/null || echo "0.0.0")
        if version_ge "$compose_version" "$MIN_DOCKER_COMPOSE_VERSION"; then
            success "Docker Compose $compose_version is already installed (>= $MIN_DOCKER_COMPOSE_VERSION)"
            compose_ok=true
        fi
    fi

    if [[ "$docker_ok" == true && "$compose_ok" == true ]]; then
        return 0
    fi

    log "Installing Docker and Docker Compose..."

    local os=$(detect_os)
    case $os in
        "ubuntu")
            # I'm installing Docker using the official repository
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

            # I'm adding the current user to the docker group
            sudo usermod -aG docker "$USER"
            ;;
        "macos")
            warn "Please install Docker Desktop for Mac from https://docs.docker.com/docker-for-mac/install/"
            return 1
            ;;
        *)
            warn "Please install Docker manually for your system"
            return 1
            ;;
    esac

    success "Docker installed successfully"
    info "Please log out and log back in for Docker group membership to take effect"
}

# I'm setting up the development database
setup_database() {
    log "Setting up development database..."

    cd "$PROJECT_ROOT"

    # I'm starting the database containers
    if docker compose ps | grep -q postgres; then
        info "Database container is already running"
    else
        log "Starting database containers..."
        docker compose up -d postgres redis

        # I'm waiting for the database to be ready
        log "Waiting for database to be ready..."
        for i in {1..30}; do
            if docker compose exec postgres pg_isready -U darkuser -d dark_performance; then
                success "Database is ready"
                break
            fi

            if [[ $i -eq 30 ]]; then
                error "Database failed to start within 60 seconds"
                return 1
            fi

            sleep 2
        done
    fi

    success "Database setup completed"
}

# I'm installing project dependencies
install_dependencies() {
    log "Installing project dependencies..."

    cd "$PROJECT_ROOT"

    # I'm installing backend dependencies
    log "Installing Rust backend dependencies..."
    cd backend
    cargo check
    cargo build
    cd ..

    # I'm installing frontend dependencies
    log "Installing Node.js frontend dependencies..."
    cd frontend
    npm ci
    cd ..

    success "All dependencies installed"
}

# I'm creating necessary environment files
setup_environment() {
    log "Setting up environment configuration..."

    cd "$PROJECT_ROOT"

    if [[ ! -f .env ]]; then
        log "Creating .env file from template..."
        cp .env.example .env

        # I'm generating secure random values
        local github_token_placeholder="your_github_personal_access_token_here"
        local github_username_placeholder="your_github_username"

        info "Please update the following values in .env:"
        info "  - GITHUB_TOKEN=$github_token_placeholder"
        info "  - GITHUB_USERNAME=$github_username_placeholder"
        info ""
        info "You can get a GitHub token at: https://github.com/settings/tokens"
    else
        success ".env file already exists"
    fi

    success "Environment setup completed"
}

# I'm running initial tests to verify the setup
verify_setup() {
    log "Verifying installation..."

    cd "$PROJECT_ROOT"

    # I'm checking Rust setup
    if ! cargo --version &> /dev/null; then
        error "Cargo is not available"
        return 1
    fi

    # I'm checking Node.js setup
    if ! node --version &> /dev/null; then
        error "Node.js is not available"
        return 1
    fi

    if ! npm --version &> /dev/null; then
        error "npm is not available"
        return 1
    fi

    # I'm checking Docker setup
    if ! docker --version &> /dev/null; then
        error "Docker is not available"
        return 1
    fi

    if ! docker compose version &> /dev/null; then
        error "Docker Compose is not available"
        return 1
    fi

    # I'm testing basic compilation
    log "Testing backend compilation..."
    cd backend
    if ! cargo check --quiet; then
        error "Backend compilation failed"
        return 1
    fi
    cd ..

    log "Testing frontend build..."
    cd frontend
    if ! npm run build &> /dev/null; then
        error "Frontend build failed"
        return 1
    fi
    cd ..

    success "All verifications passed!"
}

# I'm displaying helpful information after setup
show_next_steps() {
    echo ""
    echo -e "${PURPLE}=================================${NC}"
    echo -e "${PURPLE}   Setup Complete! 🎉${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo ""
    echo -e "${BLUE}1. Update your environment configuration:${NC}"
    echo "   edit .env"
    echo ""
    echo -e "${BLUE}2. Start the development environment:${NC}"
    echo "   docker compose up -d"
    echo ""
    echo -e "${BLUE}3. Run the backend:${NC}"
    echo "   cd backend && cargo run"
    echo ""
    echo -e "${BLUE}4. Run the frontend (in another terminal):${NC}"
    echo "   cd frontend && npm run dev"
    echo ""
    echo -e "${BLUE}5. Run the benchmark suite:${NC}"
    echo "   ./scripts/benchmark.sh"
    echo ""
    echo -e "${BLUE}6. Access the application:${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   Health Check: http://localhost:3001/health"
    echo ""
    echo -e "${GREEN}For more information, check the README.md file.${NC}"
    echo ""
}

# I'm implementing the main setup flow
main() {
    echo -e "${PURPLE}=================================${NC}"
    echo -e "${PURPLE}     Performance Showcase${NC}"
    echo -e "${PURPLE}      Development Setup${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""

    log "Starting development environment setup..."
    log "Log file: $LOG_FILE"
    echo ""

    # I'm checking if running as root (not recommended)
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root is not recommended for development setup"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # I'm running setup steps in order
    install_system_dependencies
    install_rust
    install_nodejs
    install_docker
    setup_environment
    setup_database
    install_dependencies
    verify_setup

    show_next_steps

    success "Development environment setup completed successfully!"
}

# I'm handling script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Setup script for Performance Showcase development environment"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --verify       Only run verification checks"
        echo "  --deps-only    Only install dependencies"
        echo ""
        exit 0
        ;;
    --verify)
        verify_setup
        exit $?
        ;;
    --deps-only)
        install_dependencies
        exit $?
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
