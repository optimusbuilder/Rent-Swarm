# Complete EC2 Deployment Guide for Rent Swarm

This guide walks you through deploying the Rent Swarm application to an AWS EC2 instance and connecting it to your domain `api.rent-swarm.tech`.

## Prerequisites

- AWS Account with EC2 access
- Domain registered with .tech TLD
- Access to domain DNS management
- SSH client installed on your local machine
- Git installed locally

---

## Part 1: EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Log into AWS Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**
   - **Name**: `rent-swarm-production`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**:
     - Development: `t2.micro` (1 vCPU, 1GB RAM - Free tier)
     - Production: `t2.small` or larger (2 vCPU, 2GB RAM - recommended)
   - **Key Pair**:
     - Create new key pair or use existing
     - Download the `.pem` file and save securely
     - Example: `rent-swarm-key.pem`

3. **Network Settings**
   - **VPC**: Default VPC is fine
   - **Auto-assign Public IP**: Enable
   - **Firewall (Security Group)**: Create new security group with these rules:
     - **SSH**: Port 22, Source: Your IP (for security)
     - **HTTP**: Port 80, Source: Anywhere (0.0.0.0/0)
     - **HTTPS**: Port 443, Source: Anywhere (0.0.0.0/0)
     - **Custom TCP**: Port 443 UDP, Source: Anywhere (for HTTP/3)

4. **Storage**
   - **Root Volume**: 20 GB gp3 (minimum)
   - For production: 30+ GB recommended

5. **Launch Instance**
   - Click "Launch Instance"
   - Wait for instance state to show "Running"
   - Note the **Public IPv4 Address** (e.g., 54.123.45.67)

### Step 2: Configure SSH Key Permissions

On your local machine (Linux/Mac):
```bash
chmod 400 ~/Downloads/rent-swarm-key.pem
```

On Windows (PowerShell):
```powershell
icacls "C:\Users\YourName\Downloads\rent-swarm-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

### Step 3: Connect to EC2 Instance

```bash
ssh -i ~/Downloads/rent-swarm-key.pem ubuntu@54.123.45.67
```
Replace `54.123.45.67` with your instance's public IP.

---

## Part 2: Server Setup

### Step 4: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 5: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (avoid using sudo)
sudo usermod -aG docker ubuntu

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker installation
docker --version
```

### Step 6: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 7: Install Git

```bash
sudo apt install git -y
git --version
```

### Step 8: Log Out and Back In

```bash
exit
```

Then reconnect via SSH:
```bash
ssh -i ~/Downloads/rent-swarm-key.pem ubuntu@54.123.45.67
```

This applies the Docker group membership changes.

---

## Part 3: Clone and Configure Project

### Step 9: Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/Rent-Swarm.git
cd Rent-Swarm
```

**If private repository**, you'll need to authenticate:
- Option A: Use GitHub Personal Access Token
- Option B: Use SSH keys (recommended for production)

**Setup SSH for GitHub (recommended):**
```bash
# Generate SSH key on EC2
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Copy the output and add to GitHub:
# GitHub.com > Settings > SSH and GPG keys > New SSH key
```

Then clone with SSH:
```bash
git clone git@github.com:YOUR_USERNAME/Rent-Swarm.git
```

### Step 10: Configure Environment Variables

```bash
cd ~/Rent-Swarm/rent-swarm-dashboard

# Create .env file
nano .env
```

Add your environment variables:
```env
# Add all your required environment variables here
NEXT_PUBLIC_API_URL=https://api.rent-swarm.tech
NODE_ENV=production

# Add any API keys, database URLs, etc.
GEMINI_API_KEY=your_key_here
BROWSERBASE_API_KEY=your_key_here
BROWSERBASE_PROJECT_ID=your_project_id

# Add other secrets as needed
```

Save and exit (Ctrl+X, Y, Enter).

**Important**: Never commit `.env` to version control.

---

## Part 4: Domain Configuration

### Step 11: Configure DNS Records

1. **Log into your domain registrar** (where you registered rent-swarm.tech)

2. **Add an A Record**:
   - **Type**: A
   - **Name**: `api` (this creates api.rent-swarm.tech)
   - **Value**: Your EC2 Public IP (e.g., 54.123.45.67)
   - **TTL**: 3600 (or default)

3. **Verify DNS propagation** (may take 5-60 minutes):
   ```bash
   # On your local machine
   nslookup api.rent-swarm.tech
   # or
   dig api.rent-swarm.tech
   ```

   Should return your EC2 IP address.

### Step 12: Update Caddyfile

On the EC2 instance:
```bash
cd ~/Rent-Swarm/deployment
nano Caddyfile
```

Update the domain:
```caddyfile
# Caddyfile for api.rent-swarm.tech
# Caddy automatically handles HTTPS with Let's Encrypt

api.rent-swarm.tech {
    # Reverse proxy to Next.js application
    reverse_proxy nextjs:3000 {
        # Health check configuration
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }

    # Enable gzip compression
    encode gzip zstd

    # Logging
    log {
        output file /var/log/caddy/rent-swarm.log
        format json
    }

    # Security headers
    header {
        # Enable HTTP Strict Transport Security (HSTS)
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

        # Prevent MIME type sniffing
        X-Content-Type-Options "nosniff"

        # Enable XSS protection
        X-Frame-Options "SAMEORIGIN"

        # Remove Server header for security
        -Server
    }
}

# Optional: Redirect www to non-www
www.api.rent-swarm.tech {
    redir https://api.rent-swarm.tech{uri} permanent
}
```

**Important**: Note the change from `localhost:3000` to `nextjs:3000` (Docker service name).

Save and exit.

---

## Part 5: Deploy Application

### Step 13: Build and Start Services

```bash
cd ~/Rent-Swarm/deployment

# Build and start all services
docker-compose up -d --build
```

This will:
- Build the Next.js application Docker image
- Start the Next.js container
- Start the Caddy reverse proxy container
- Caddy will automatically obtain SSL certificates from Let's Encrypt

### Step 14: Monitor Deployment

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f caddy
docker-compose logs -f nextjs

# Check container status
docker-compose ps
```

Press `Ctrl+C` to exit log viewing.

### Step 15: Verify Deployment

1. **Check if containers are running**:
   ```bash
   docker-compose ps
   ```
   Both `rent-swarm-app` and `rent-swarm-caddy` should show "Up".

2. **Test the application**:
   ```bash
   # Test locally on EC2
   curl http://localhost:3000

   # Test through Caddy (HTTP - will redirect to HTTPS)
   curl -L http://api.rent-swarm.tech

   # Test HTTPS
   curl https://api.rent-swarm.tech
   ```

3. **Open in browser**:
   - Navigate to: `https://api.rent-swarm.tech`
   - You should see your application with a valid SSL certificate

---

## Part 6: Monitoring and Management

### Common Commands

**View logs**:
```bash
cd ~/Rent-Swarm/deployment

# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f nextjs
docker-compose logs -f caddy
```

**Restart services**:
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart nextjs
docker-compose restart caddy
```

**Stop services**:
```bash
docker-compose down
```

**Update application** (after code changes):
```bash
cd ~/Rent-Swarm

# Pull latest changes
git pull origin main

# Rebuild and restart
cd deployment
docker-compose up -d --build nextjs
```

**View disk usage**:
```bash
df -h
docker system df
```

**Clean up unused Docker resources**:
```bash
docker system prune -a
```

---

## Part 7: Security Hardening

### Step 16: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 443/udp   # HTTP/3
sudo ufw enable

# Check status
sudo ufw status
```

### Step 17: Set Up Automatic Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### Step 18: Restrict SSH Access (Optional but Recommended)

Edit SSH config:
```bash
sudo nano /etc/ssh/sshd_config
```

Recommended changes:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

---

## Part 8: Backup Strategy

### Step 19: Set Up Automatic Backups

Create backup script:
```bash
nano ~/backup-rent-swarm.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup environment file
cp ~/Rent-Swarm/rent-swarm-dashboard/.env $BACKUP_DIR/.env_$DATE

# Backup Caddy data (SSL certificates)
docker run --rm -v deployment_caddy_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/caddy_data_$DATE.tar.gz -C /data .

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name ".env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
chmod +x ~/backup-rent-swarm.sh
```

Schedule daily backups:
```bash
crontab -e
```

Add line:
```
0 2 * * * /home/ubuntu/backup-rent-swarm.sh >> /home/ubuntu/backup.log 2>&1
```

---

## Troubleshooting

### SSL Certificate Issues

**Problem**: SSL certificates not being obtained

**Solutions**:
```bash
# 1. Check Caddy logs
docker-compose logs caddy

# 2. Verify DNS is pointing to server
nslookup api.rent-swarm.tech

# 3. Ensure ports 80 and 443 are accessible
sudo netstat -tulpn | grep -E ':(80|443)'

# 4. Check Security Group rules in AWS Console

# 5. Restart Caddy
docker-compose restart caddy
```

### Application Not Starting

```bash
# Check container status
docker-compose ps

# View logs for errors
docker-compose logs nextjs

# Check if port 3000 is in use
docker-compose exec nextjs netstat -tulpn

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a -f

# Remove old images
docker image prune -a

# Check logs size
sudo du -sh /var/lib/docker/containers/*/*-json.log
```

### Memory Issues

```bash
# Check memory usage
free -h

# View container resource usage
docker stats

# Consider upgrading to larger instance type
```

### Can't Connect via SSH

```bash
# From local machine, check if SSH port is open
nc -zv 54.123.45.67 22

# Check Security Group rules in AWS Console
# Ensure your IP is allowed on port 22
```

---

## Maintenance Tasks

### Update Application Code

```bash
cd ~/Rent-Swarm
git pull origin main
cd deployment
docker-compose up -d --build nextjs
```

### View Application Health

```bash
# Check container health
docker-compose ps

# View resource usage
docker stats

# Check logs for errors
docker-compose logs --tail=50 nextjs
```

### Renew SSL Certificates

Caddy automatically renews certificates, but to force renewal:
```bash
docker-compose restart caddy
```

### Monitor Server Resources

```bash
# CPU and Memory
top

# Disk usage
df -h

# Network connections
netstat -tuln
```

---

## Cost Optimization

### EC2 Instance Costs

- **t2.micro**: ~$8-10/month (free tier: 750 hours/month for 12 months)
- **t2.small**: ~$17/month
- **t2.medium**: ~$34/month

### Tips to Reduce Costs

1. **Use Reserved Instances** for long-term deployments (save up to 75%)
2. **Stop instance during non-business hours** if appropriate
3. **Enable CloudWatch alarms** for billing alerts
4. **Use Spot Instances** for non-critical workloads

---

## Next Steps

### Additional Enhancements

1. **Set up CloudWatch monitoring**
   - Monitor EC2 metrics
   - Set up alarms for high CPU/memory usage

2. **Configure automated backups**
   - Use AWS Backup or EBS snapshots

3. **Set up CI/CD pipeline**
   - GitHub Actions for automatic deployments

4. **Add database**
   - RDS for PostgreSQL/MySQL
   - Or add database container to docker-compose.yml

5. **Load Balancer** (for high availability)
   - AWS Application Load Balancer
   - Multiple EC2 instances

6. **CDN** (for better performance)
   - CloudFront in front of your application

---

## Support and Resources

- **AWS Documentation**: https://docs.aws.amazon.com/ec2/
- **Docker Documentation**: https://docs.docker.com/
- **Caddy Documentation**: https://caddyserver.com/docs/
- **Next.js Documentation**: https://nextjs.org/docs

---

## Quick Reference Commands

```bash
# Connect to EC2
ssh -i ~/path/to/key.pem ubuntu@api.rent-swarm.tech

# Navigate to project
cd ~/Rent-Swarm/deployment

# View logs
docker-compose logs -f

# Restart application
docker-compose restart nextjs

# Update application
cd ~/Rent-Swarm && git pull && cd deployment && docker-compose up -d --build nextjs

# Check status
docker-compose ps

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

---

## Checklist

- [ ] EC2 instance launched and running
- [ ] SSH key configured and can connect
- [ ] Docker and Docker Compose installed
- [ ] Project cloned to EC2
- [ ] .env file configured with all required variables
- [ ] DNS A record added for api.rent-swarm.tech
- [ ] DNS propagated (can resolve domain)
- [ ] Caddyfile updated with correct domain
- [ ] Application deployed with docker-compose
- [ ] SSL certificate obtained automatically
- [ ] Application accessible at https://api.rent-swarm.tech
- [ ] Firewall (UFW) configured
- [ ] Automatic security updates enabled
- [ ] Backup script created and scheduled
- [ ] Monitoring set up

---

**Congratulations!** Your Rent Swarm application should now be live at https://api.rent-swarm.tech with automatic SSL certificates and reverse proxy configured through Caddy.
