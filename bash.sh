#!/bin/bash
# ─────────────────────────────────────────────
# IoT Monitoring System — Helper Script
# Usage: ./bash.sh [command]
# ─────────────────────────────────────────────

set -e  # Exit immediately if any command fails

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ── Helper ──────────────────────────────────
print_usage() {
  echo ""
  echo "Usage: ./bash.sh [command]"
  echo ""
  echo "Commands:"
  echo "  setup       Create secrets folder and prompt for passwords"
  echo "  start       Build images and start all services"
  echo "  stop        Stop all running services"
  echo "  restart     Stop then start all services"
  echo "  logs        Follow logs for all services"
  echo "  status      Show status of all containers"
  echo "  clean       Stop services and remove volumes (WARNING: deletes data)"
  echo ""
}

# ── Commands ────────────────────────────────
setup() {
  echo -e "${YELLOW}Setting up secrets...${NC}"
  mkdir -p secrets

  if [ ! -f secrets/mysql_root_password.txt ]; then
    read -sp "Enter MySQL root password: " db_pass
    echo ""
    echo "$db_pass" > secrets/mysql_root_password.txt
    chmod 600 secrets/mysql_root_password.txt
    echo -e "${GREEN}✔ MySQL password saved${NC}"
  else
    echo -e "${GREEN}✔ MySQL password already exists — skipping${NC}"
  fi

  if [ ! -f secrets/jwt_secret.txt ]; then
    read -sp "Enter JWT secret: " jwt_secret
    echo ""
    echo "$jwt_secret" > secrets/jwt_secret.txt
    chmod 600 secrets/jwt_secret.txt
    echo -e "${GREEN}✔ JWT secret saved${NC}"
  else
    echo -e "${GREEN}✔ JWT secret already exists — skipping${NC}"
  fi

  echo -e "${GREEN}Setup complete!${NC}"
}

start() {
  echo -e "${YELLOW}Starting all services...${NC}"
  docker compose up --build -d
  echo -e "${GREEN}✔ All services started${NC}"
  echo -e "Frontend  → http://localhost"
  echo -e "Backend   → http://localhost:8080"
}

stop() {
  echo -e "${YELLOW}Stopping all services...${NC}"
  docker compose down
  echo -e "${GREEN}✔ All services stopped${NC}"
}

restart() {
  stop
  start
}

logs() {
  docker compose logs --follow
}

status() {
  docker compose ps
}

clean() {
  echo -e "${RED}WARNING: This will delete all data including the database volume!${NC}"
  read -p "Are you sure? (yes/no): " confirm
  if [ "$confirm" = "yes" ]; then
    docker compose down -v
    echo -e "${GREEN}✔ All services and volumes removed${NC}"
  else
    echo "Cancelled."
  fi
}

# ── Entry Point ─────────────────────────────
case "$1" in
  setup)    setup ;;
  start)    start ;;
  stop)     stop ;;
  restart)  restart ;;
  logs)     logs ;;
  status)   status ;;
  clean)    clean ;;
  *)        print_usage ;;
esac
