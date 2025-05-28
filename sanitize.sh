#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║    ☢️  DOCKER SANITIZE INITIATED   ☢️    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${RED}→ Bringing everything down...${NC}"
docker-compose down --remove-orphans

echo -e "${RED}→ Sanitizing...${NC}"
docker system prune -a --volumes -f

echo -e "${GREEN}→ Rebuilding...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}→ Launching Sanitized...${NC}"
docker-compose up
