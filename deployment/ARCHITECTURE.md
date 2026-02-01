# Rent Swarm Deployment Architecture

This document explains the architecture of the deployed Rent Swarm application.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (443)
                              │ HTTP (80)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    api.rent-swarm.tech                       │
│                        (DNS Record)                          │
│                Points to EC2 Public IP                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS EC2 Instance                        │
│                    Ubuntu 22.04 LTS                          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Docker Compose Network                      │  │
│  │           (rent-swarm-network)                        │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────┐            │  │
│  │  │  Caddy Container                    │            │  │
│  │  │  (rent-swarm-caddy)                 │            │  │
│  │  │                                     │            │  │
│  │  │  • Reverse Proxy                    │            │  │
│  │  │  • Automatic SSL/TLS                │            │  │
│  │  │  • Let's Encrypt Integration        │            │  │
│  │  │  • HTTP → HTTPS Redirect            │            │  │
│  │  │  • Gzip/Zstd Compression            │            │  │
│  │  │  • Security Headers                 │            │  │
│  │  │                                     │            │  │
│  │  │  Ports: 80, 443, 443/udp            │            │  │
│  │  └─────────────────┬───────────────────┘            │  │
│  │                    │                                 │  │
│  │                    │ Proxy to                        │  │
│  │                    │ nextjs:3000                     │  │
│  │                    ▼                                 │  │
│  │  ┌─────────────────────────────────────┐            │  │
│  │  │  Next.js Container                  │            │  │
│  │  │  (rent-swarm-app)                   │            │  │
│  │  │                                     │            │  │
│  │  │  • Next.js 16 Application           │            │  │
│  │  │  • Node.js 20                       │            │  │
│  │  │  • Production Build                 │            │  │
│  │  │  • Standalone Output                │            │  │
│  │  │  • React 19 Frontend                │            │  │
│  │  │  • Server-Side Rendering            │            │  │
│  │  │                                     │            │  │
│  │  │  Port: 3000 (internal)              │            │  │
│  │  └─────────────────────────────────────┘            │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Docker Volumes                           │  │
│  │                                                       │  │
│  │  • caddy_data (SSL certificates)                     │  │
│  │  • caddy_config (Caddy configuration)                │  │
│  │  • caddy_logs (Request logs)                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. DNS Layer (api.rent-swarm.tech)

**Purpose**: Domain name resolution

**Configuration**:
- A Record pointing to EC2 Public IP
- TTL: 3600 seconds (1 hour)

**Registrar**: Your .tech domain provider

**Documentation**: [DNS_SETUP_GUIDE.md](./DNS_SETUP_GUIDE.md)

---

### 2. AWS EC2 Instance

**Purpose**: Host the application infrastructure

**Specifications** (Recommended):
- **Instance Type**: t2.small (2 vCPU, 2GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20-30 GB gp3 SSD
- **Network**: Public IP with Elastic IP (recommended)

**Security Group Rules**:
```
Port    Protocol    Source          Purpose
22      TCP         Your IP         SSH access
80      TCP         0.0.0.0/0       HTTP (redirects to HTTPS)
443     TCP         0.0.0.0/0       HTTPS
443     UDP         0.0.0.0/0       HTTP/3 (QUIC)
```

**Software Installed**:
- Docker 24+
- Docker Compose 2.x
- Git
- UFW Firewall

---

### 3. Caddy Reverse Proxy

**Purpose**: Handle incoming requests, SSL/TLS, and routing

**Container**: `rent-swarm-caddy`
**Image**: `caddy:2.11-alpine`

**Features**:
- **Automatic SSL/TLS**: Obtains and renews Let's Encrypt certificates
- **HTTP/2 & HTTP/3**: Modern protocol support
- **Reverse Proxy**: Routes requests to Next.js container
- **Compression**: Gzip and Zstd for faster transfers
- **Security Headers**: HSTS, X-Frame-Options, etc.
- **Logging**: JSON-formatted request logs

**Configuration**: `Caddyfile`

**Exposed Ports**:
- `80:80` - HTTP (redirects to HTTPS)
- `443:443` - HTTPS
- `443:443/udp` - HTTP/3 (QUIC)

**Docker Volumes**:
- `caddy_data` - Stores SSL certificates (persistent)
- `caddy_config` - Caddy configuration cache
- `caddy_logs` - Request logs

---

### 4. Next.js Application

**Purpose**: Serve the Rent Swarm web application

**Container**: `rent-swarm-app`
**Base Image**: `node:20-alpine`

**Build Process** (Multi-stage):
1. **deps stage**: Install Node.js dependencies
2. **builder stage**: Build Next.js application
3. **runner stage**: Run production server (standalone)

**Features**:
- **Next.js 16**: Latest framework version
- **React 19**: Modern React features
- **TypeScript**: Type-safe development
- **Standalone Output**: Optimized production build
- **Server Components**: RSC architecture
- **API Routes**: Backend endpoints

**Port**: `3000` (internal only, accessed via Caddy)

**Environment Variables**: Loaded from `.env` file
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL`
- API keys and secrets

**Health Check**:
```yaml
test: ["CMD", "wget", "--spider", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
```

---

## Request Flow

### 1. User Request

```
User Browser → https://api.rent-swarm.tech
```

### 2. DNS Resolution

```
api.rent-swarm.tech → [DNS Query] → EC2 Public IP (e.g., 54.123.45.67)
```

### 3. TLS Handshake

```
Browser ←→ Caddy (Port 443)
  • Caddy presents Let's Encrypt SSL certificate
  • Secure connection established
```

### 4. Reverse Proxy

```
Caddy → Next.js Container (Port 3000)
  • Adds forwarding headers (X-Real-IP, X-Forwarded-For)
  • Compresses response
  • Adds security headers
```

### 5. Application Processing

```
Next.js Application
  • Processes request
  • Server-side rendering (if needed)
  • Fetches data from APIs
  • Generates response
```

### 6. Response

```
Next.js → Caddy → User Browser
  • Compressed (gzip/zstd)
  • Security headers added
  • Logged by Caddy
```

---

## Network Architecture

### Docker Network

**Name**: `rent-swarm-network`
**Driver**: `bridge`

**Purpose**: Allows containers to communicate using service names

**Service Discovery**:
- `caddy` → `nextjs:3000` (automatic DNS resolution)
- Isolated from host network
- Secure container-to-container communication

---

## Data Persistence

### Docker Volumes

1. **caddy_data**
   - **Purpose**: SSL/TLS certificates from Let's Encrypt
   - **Critical**: Must be backed up
   - **Location**: Docker managed volume
   - **Size**: ~10 MB

2. **caddy_config**
   - **Purpose**: Caddy configuration cache
   - **Critical**: No (regenerates automatically)
   - **Location**: Docker managed volume
   - **Size**: ~1 MB

3. **caddy_logs**
   - **Purpose**: HTTP request logs
   - **Critical**: No (for monitoring only)
   - **Location**: Docker managed volume
   - **Size**: Grows over time (rotate recommended)

### File Mounts

- `./Caddyfile:/etc/caddy/Caddyfile` (read-only configuration)

---

## Security Architecture

### Network Security

1. **AWS Security Groups**:
   - Restrict SSH to specific IPs
   - Allow HTTP/HTTPS from anywhere
   - Block all other ports

2. **UFW Firewall** (Host Level):
   ```
   22/tcp  - SSH
   80/tcp  - HTTP
   443/tcp - HTTPS
   443/udp - HTTP/3
   ```

3. **Docker Network Isolation**:
   - Containers communicate only through defined network
   - Next.js not directly exposed to internet

### Application Security

1. **SSL/TLS**:
   - Automatic certificate management
   - Strong cipher suites
   - TLS 1.2+ only

2. **Security Headers** (via Caddy):
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   X-Content-Type-Options: nosniff
   X-Frame-Options: SAMEORIGIN
   ```

3. **Container Security**:
   - Next.js runs as non-root user (uid 1001)
   - Minimal Alpine base images
   - No unnecessary services

### Secrets Management

- Environment variables stored in `.env` file
- Not committed to version control
- Loaded into container at runtime
- File permissions: `600` (owner only)

---

## Scaling Considerations

### Current Architecture (Single Instance)

**Capacity**:
- **Concurrent Users**: ~100-500 (depends on app complexity)
- **Requests/Second**: ~50-100 RPS
- **Instance**: t2.small (2 vCPU, 2GB RAM)

**Limitations**:
- Single point of failure
- No geographic redundancy
- Limited by single instance resources

### Future Scaling Options

#### Vertical Scaling (Easier)

Upgrade EC2 instance type:
- `t2.medium` (2 vCPU, 4GB RAM)
- `t2.large` (2 vCPU, 8GB RAM)
- `t3.xlarge` (4 vCPU, 16GB RAM)

No architecture changes needed.

#### Horizontal Scaling (More Complex)

Add multiple EC2 instances:
```
                    Internet
                       │
                       ▼
            Application Load Balancer (ALB)
                   /       \
                  /         \
           EC2 Instance   EC2 Instance
            (Zone A)       (Zone B)
```

**Required Changes**:
- Add AWS Application Load Balancer
- Multiple EC2 instances
- Shared database (RDS)
- Shared session storage (Redis)
- Update DNS to point to ALB

#### Containerization at Scale

Move to orchestration:
- **AWS ECS/Fargate**: Managed containers
- **Kubernetes (EKS)**: Full orchestration
- **Docker Swarm**: Simpler orchestration

---

## Monitoring & Observability

### Current Monitoring

**Logs**:
```bash
# Application logs
docker-compose logs -f nextjs

# Proxy logs
docker-compose logs -f caddy

# System logs
journalctl -u docker
```

**Resource Monitoring**:
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Recommended Additions

1. **Application Performance Monitoring (APM)**:
   - Vercel Analytics (built into Next.js)
   - DataDog, New Relic, or Sentry

2. **Infrastructure Monitoring**:
   - AWS CloudWatch (EC2 metrics)
   - Prometheus + Grafana

3. **Log Aggregation**:
   - AWS CloudWatch Logs
   - ELK Stack (Elasticsearch, Logstash, Kibana)

4. **Uptime Monitoring**:
   - UptimeRobot
   - Pingdom
   - StatusCake

---

## Backup & Disaster Recovery

### Critical Data to Backup

1. **SSL Certificates** (caddy_data volume)
2. **Application Code** (Git repository)
3. **Environment Variables** (.env file)
4. **Database** (if applicable)

### Backup Strategy

**Automated Backup Script** (`backup-rent-swarm.sh`):
- Runs daily via cron (2 AM)
- Backs up Caddy data volume
- Backs up .env file
- Retains last 7 days

**Manual Backup**:
```bash
# Backup SSL certificates
docker run --rm -v deployment_caddy_data:/data -v ~/backup:/backup \
  alpine tar czf /backup/caddy_$(date +%Y%m%d).tar.gz -C /data .

# Backup environment
cp ~/Rent-Swarm/rent-swarm-dashboard/.env ~/backup/.env_$(date +%Y%m%d)
```

### Disaster Recovery

**EC2 Instance Failure**:
1. Launch new EC2 instance
2. Install Docker/Docker Compose
3. Clone repository
4. Restore .env file
5. Deploy with docker-compose
6. Restore SSL certificates (or wait for regeneration)

**RTO (Recovery Time Objective)**: ~30 minutes
**RPO (Recovery Point Objective)**: Up to 24 hours (daily backups)

---

## Cost Analysis

### Monthly Costs (Estimated)

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| EC2 Instance | t2.small | ~$17 |
| Elastic IP | Associated | Free |
| EBS Storage | 30 GB gp3 | ~$3 |
| Data Transfer | First 100 GB | Free |
| Data Transfer | Per GB after | $0.09/GB |
| **Total** | | **~$20-25/mo** |

**Free Tier** (First 12 months):
- t2.micro (750 hours/month) - Free
- 30 GB EBS storage - Free
- 15 GB data transfer - Free

**Estimated Total with Free Tier**: ~$0-5/month

### Cost Optimization

1. **Use Reserved Instances**: Save up to 75%
2. **Use Spot Instances**: Save up to 90% (for non-critical)
3. **Optimize instance size**: Match workload requirements
4. **Enable CloudWatch alarms**: Monitor and alert on costs

---

## Summary

This architecture provides:
- ✅ **Secure**: SSL/TLS, firewall, security headers
- ✅ **Scalable**: Can upgrade instance or add load balancer
- ✅ **Maintainable**: Docker Compose for easy updates
- ✅ **Cost-effective**: ~$20-25/month or free tier eligible
- ✅ **Reliable**: Health checks, automatic restarts
- ✅ **Observable**: Logs and monitoring capabilities

---

## Related Documentation

- [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md) - Deployment instructions
- [DNS_SETUP_GUIDE.md](./DNS_SETUP_GUIDE.md) - DNS configuration
- [QUICK_START.md](./QUICK_START.md) - Quick reference
- [README.md](./README.md) - Docker configuration details
