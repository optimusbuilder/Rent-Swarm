# Rent Swarm Deployment Guide

This directory contains the deployment configuration for the Rent Swarm application using Docker and Caddy.

## 📚 Documentation

- **[EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide for deploying to AWS EC2
- **[QUICK_START.md](./QUICK_START.md)** - Condensed quick reference for deployment
- **[README.md](./README.md)** - This file - Docker and Caddy configuration reference

## 🚀 Quick Deploy to EC2

1. **Launch EC2 instance** (Ubuntu 22.04, t2.small minimum)
2. **Run setup script**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/Rent-Swarm/main/deployment/setup-server.sh | bash
   ```
3. **Configure DNS** - Point `api.rent-swarm.tech` to your EC2 IP
4. **Clone repo and deploy**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Rent-Swarm.git
   cd Rent-Swarm/rent-swarm-dashboard
   cp .env.example .env
   nano .env  # Add your environment variables
   cd ../deployment
   docker-compose up -d --build
   ```

For detailed instructions, see [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md).

## Prerequisites

- Docker and Docker Compose installed on your server
- Domain name (api.rent-swarm.tech) pointing to your server's IP address
- Port 80 and 443 open on your server firewall

## Project Structure

```
deployment/
├── Caddyfile                    # Caddy reverse proxy configuration
├── docker-compose.yml           # Docker Compose orchestration
├── EC2_DEPLOYMENT_GUIDE.md      # Complete EC2 deployment guide
├── QUICK_START.md               # Quick reference guide
├── README.md                    # This file
├── setup-server.sh              # Automated server setup script
└── update-app.sh                # Application update script

rent-swarm-dashboard/
├── Dockerfile                   # Next.js application Docker image
├── .dockerignore                # Files to exclude from Docker build
└── .env.example                 # Example environment variables

.github/workflows/
└── deploy.yml.example           # GitHub Actions CI/CD template
```

## 🛠️ Helper Scripts

### `setup-server.sh`
Automates initial EC2 server setup:
- Installs Docker and Docker Compose
- Installs Git
- Configures UFW firewall
- Sets up automatic security updates

```bash
./setup-server.sh
```

### `update-app.sh`
Updates and redeploys the application:
- Pulls latest code from Git
- Rebuilds Docker images
- Restarts services

```bash
./update-app.sh
```

## Configuration

### Environment Variables

Make sure you have a `.env` file in the `rent-swarm-dashboard` directory with all required environment variables for your Next.js application.

### Caddy Configuration

The Caddyfile is configured to:
- Automatically obtain and renew SSL certificates from Let's Encrypt
- Reverse proxy requests to the Next.js application on port 3000
- Enable gzip and zstd compression
- Add security headers (HSTS, X-Frame-Options, etc.)
- Redirect www.rent-swarm.tech to rent-swarm.tech
- Log requests to `/var/log/caddy/rent-swarm.log`

## Deployment Steps

### 1. Initial Setup

Navigate to the deployment directory:
```bash
cd deployment
```

### 2. Build and Start Services

Start all services with Docker Compose:
```bash
docker-compose up -d --build
```

This will:
- Build the Next.js application Docker image
- Start the Next.js application on port 3000
- Start Caddy on ports 80 and 443
- Automatically obtain SSL certificates

### 3. View Logs

To view logs from all services:
```bash
docker-compose logs -f
```

To view logs from a specific service:
```bash
docker-compose logs -f nextjs
docker-compose logs -f caddy
```

### 4. Check Service Status

```bash
docker-compose ps
```

## Managing the Deployment

### Stop Services

```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build nextjs
```

### Update Caddy Configuration

After modifying the Caddyfile:
```bash
docker-compose restart caddy
```

## Troubleshooting

### Check if services are running

```bash
docker-compose ps
```

### View real-time logs

```bash
docker-compose logs -f
```

### Test Next.js application directly

```bash
curl http://localhost:3000
```

### Test through Caddy

```bash
curl https://rent-swarm.tech
```

### SSL Certificate Issues

If SSL certificates aren't being obtained:
1. Ensure ports 80 and 443 are accessible from the internet
2. Verify DNS records point to your server
3. Check Caddy logs: `docker-compose logs caddy`
4. Ensure no other service is using ports 80/443

### Rebuild from scratch

```bash
docker-compose down -v
docker-compose up -d --build
```

## Security Notes

- The `.env` file contains sensitive information and should never be committed to version control
- Caddy automatically handles SSL/TLS with Let's Encrypt
- Security headers are enabled by default in the Caddyfile
- The Next.js application runs as a non-root user inside the container

## Performance Optimization

The Docker setup includes:
- Multi-stage builds to minimize image size
- Next.js standalone output for optimal production builds
- Gzip and Zstd compression via Caddy
- Health checks for the Next.js application

## Backup

Important data to backup:
- `caddy_data` volume (contains SSL certificates)
- Application database (if applicable)
- `.env` file

## Support

For issues related to:
- Next.js configuration: Check the Next.js documentation
- Caddy configuration: Check the Caddy documentation
- Docker issues: Check Docker and Docker Compose documentation
