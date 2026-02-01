# Quick Start Deployment Guide

This is a condensed version of the full deployment guide. For detailed instructions, see [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md).

## Prerequisites Checklist

- [ ] AWS account with EC2 access
- [ ] Domain `rent-swarm.tech` registered
- [ ] SSH client installed
- [ ] Git installed locally

---

## 1. Launch EC2 Instance (5 minutes)

1. **AWS Console → EC2 → Launch Instance**
2. **Settings**:
   - Name: `rent-swarm-production`
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: `t2.small` (minimum)
   - Key Pair: Create/download `.pem` file
   - Security Group Rules:
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
     - HTTPS UDP (443) - Anywhere
3. **Launch** and note the Public IP

---

## 2. Connect to EC2

```bash
# Set key permissions
chmod 400 ~/Downloads/your-key.pem

# Connect via SSH
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_EC2_IP
```

---

## 3. Run Automated Setup Script

On the EC2 instance, run:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/Rent-Swarm/main/deployment/setup-server.sh -o setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

**Or manually install Docker:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Log out and back in
exit
```

Reconnect via SSH after logging out.

---

## 4. Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/Rent-Swarm.git
cd Rent-Swarm
```

**For private repo**, set up SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add output to GitHub.com → Settings → SSH Keys
```

---

## 5. Configure Environment

```bash
cd ~/Rent-Swarm/rent-swarm-dashboard
nano .env
```

Add your environment variables:
```env
NEXT_PUBLIC_API_URL=https://api.rent-swarm.tech
NODE_ENV=production
GEMINI_API_KEY=your_key_here
BROWSERBASE_API_KEY=your_key_here
BROWSERBASE_PROJECT_ID=your_project_id
# Add other variables as needed
```

Save (Ctrl+X, Y, Enter).

---

## 6. Configure DNS

1. **Go to your domain registrar**
2. **Add A Record**:
   - Type: `A`
   - Name: `api`
   - Value: `YOUR_EC2_IP`
   - TTL: `3600`
3. **Wait 5-60 minutes** for propagation

**Verify DNS**:
```bash
nslookup api.rent-swarm.tech
```

---

## 7. Deploy Application

```bash
cd ~/Rent-Swarm/deployment
docker-compose up -d --build
```

**Monitor deployment**:
```bash
docker-compose logs -f
```

Press Ctrl+C to exit logs.

---

## 8. Verify Deployment

**Check container status**:
```bash
docker-compose ps
```

**Test application**:
```bash
# Local test
curl http://localhost:3000

# Test via domain
curl https://api.rent-swarm.tech
```

**Open in browser**:
https://api.rent-swarm.tech

---

## 9. Set Up Firewall (Optional but Recommended)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

---

## Common Commands

```bash
# Navigate to project
cd ~/Rent-Swarm/deployment

# View logs
docker-compose logs -f

# Restart application
docker-compose restart nextjs

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Update application (after git pull)
docker-compose up -d --build nextjs

# Check status
docker-compose ps
```

---

## Troubleshooting

### SSL Certificate Not Working
```bash
# Check Caddy logs
docker-compose logs caddy

# Verify DNS
nslookup api.rent-swarm.tech

# Restart Caddy
docker-compose restart caddy
```

### Application Not Loading
```bash
# Check Next.js logs
docker-compose logs nextjs

# Rebuild application
docker-compose down
docker-compose up -d --build
```

### Can't Connect via SSH
- Check Security Group rules in AWS Console
- Ensure your IP is whitelisted on port 22

### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if Nginx is running
```

---

## Deployment Checklist

- [ ] EC2 instance launched (t2.small minimum)
- [ ] Security Group configured (ports 22, 80, 443)
- [ ] SSH connection working
- [ ] Docker and Docker Compose installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] .env file configured
- [ ] DNS A record added (api.rent-swarm.tech → EC2 IP)
- [ ] DNS propagated (can resolve domain)
- [ ] Application deployed (`docker-compose up -d --build`)
- [ ] Containers running (`docker-compose ps`)
- [ ] SSL certificate obtained (check logs)
- [ ] Application accessible via HTTPS
- [ ] Firewall configured (UFW)

---

## Next Steps

1. **Set up monitoring** (CloudWatch)
2. **Configure automated backups**
3. **Set up CI/CD pipeline** (GitHub Actions)
4. **Add database** (if needed)
5. **Configure domain for www** (optional)

---

## Support

For detailed instructions and troubleshooting, see:
- [Full EC2 Deployment Guide](./EC2_DEPLOYMENT_GUIDE.md)
- [Docker Compose Reference](./README.md)

**Need help?** Check the logs:
```bash
docker-compose logs -f
```
