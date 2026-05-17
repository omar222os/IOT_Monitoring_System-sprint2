A full-stack IoT monitoring platform built with Angular, Spring Boot, and MySQL,
containerized with Docker.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│   Angular   │────▶│  Spring Boot    │────▶│     MySQL     │
│  (nginx:80) │     │  (Tomcat:8080)  │     │  (monitoring) │
└─────────────┘     └─────────────────┘     └───────────────┘
  frontend-net            both nets             backend-net
```

## Project Structure

```
Iot-project/
├── backend/          # Spring Boot application
│   ├── Dockerfile
│   └── app/
├── frontend/         # Angular application
│   ├── Dockerfile
│   └── app/
├── db/               # MySQL setup
│   ├── Dockerfile
│   └── schema.sql
├── secrets/          # Created locally — never committed to Git
├── bash.sh           # Helper script for common operations
└── docker-compose.yml
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd IOT_Monitoring_System-sprint2
```

### 2. Run setup (first time only)
Creates the secrets folder and prompts for passwords:
```bash
chmod +x bash.sh
./bash.sh setup
```

### 3. Start all services
```bash
./bash.sh start
```

### 4. Open the app
| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost      |
| Backend  | http://localhost:8080 |

## Common Commands

| Command              | Description                        |
|----------------------|------------------------------------|
| `./bash.sh start`   | Build images and start services    |
| `./bash.sh stop`    | Stop all services                  |
| `./bash.sh restart` | Restart all services               |
| `./bash.sh logs`    | Follow logs for all services       |
| `./bash.sh status`  | Show container health and ports    |
| `./bash.sh clean`   | Stop services and delete all data  |

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `MYSQL_DATABASE` | database | Database name |
| `JWT_EXPIRATION_MS` | backend | Token validity in ms (default: 24h) |

## Secrets

Sensitive values are stored as Docker secrets — never as plain environment variables.

| Secret file | Used by | Purpose |
|---|---|---|
| `secrets/mysql_root_password.txt` | database, backend | MySQL root password |
| `secrets/jwt_secret.txt` | backend | JWT signing key |

> ⚠️ The `secrets/` folder is in `.gitignore` and must **never** be committed to Git.

## Docker Best Practices Applied

- **Multi-stage builds** — small final images (no build tools in production)
- **Non-root users** — all containers run as unprivileged users
- **Docker secrets** — no passwords in environment variables or images
- **Named volumes** — data persists across container restarts
- **Network isolation** — database unreachable from frontend
- **`.dockerignore`** — build context excludes unnecessary files
- **Health checks** — services start in dependency order
```

