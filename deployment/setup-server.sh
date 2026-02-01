#!/bin/bash

# Rent Swarm EC2 Server Setup Script
# This script automates the initial setup of an EC2 instance for deploying Rent Swarm
# Usage: ./setup-server.sh

set -e  # Exit on any error

echo "========================================"
echo "Rent Swarm Server Setup Script"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run this script as root or with sudo"
    echo "Run as: ./setup-server.sh"
    exit 1
fi

echo "📦 Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y

echo ""
echo "🐳 Step 2: Installing Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is already installed"
    docker --version
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh

    # Add current user to docker group
    sudo usermod -aG docker $USER

    echo "✓ Docker installed successfully"
    docker --version
fi

echo ""
echo "📦 Step 3: Installing Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose is already installed"
    docker-compose --version
else
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    echo "✓ Docker Compose installed successfully"
    docker-compose --version
fi

echo ""
echo "🔧 Step 4: Installing Git..."
if command -v git &> /dev/null; then
    echo "✓ Git is already installed"
    git --version
else
    sudo apt install git -y
    echo "✓ Git installed successfully"
    git --version
fi

echo ""
echo "🔥 Step 5: Setting up UFW Firewall..."
if command -v ufw &> /dev/null; then
    # Configure firewall
    sudo ufw --force enable
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw allow 443/udp  # HTTP/3

    echo "✓ Firewall configured"
    sudo ufw status
else
    echo "⚠ UFW not available on this system"
fi

echo ""
echo "🔒 Step 6: Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker
echo "✓ Docker service enabled and started"

echo ""
echo "🔄 Step 7: Setting up automatic security updates..."
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
echo "✓ Automatic updates configured"

echo ""
echo "========================================"
echo "✅ Server setup completed successfully!"
echo "========================================"
echo ""
echo "⚠️  IMPORTANT: You need to log out and log back in for Docker group changes to take effect."
echo ""
echo "Next steps:"
echo "1. Log out: exit"
echo "2. Log back in via SSH"
echo "3. Clone your repository:"
echo "   git clone https://github.com/YOUR_USERNAME/Rent-Swarm.git"
echo "4. Configure .env file with your environment variables"
echo "5. Deploy application:"
echo "   cd Rent-Swarm/deployment"
echo "   docker-compose up -d --build"
echo ""
echo "For detailed instructions, see:"
echo "  - EC2_DEPLOYMENT_GUIDE.md"
echo "  - QUICK_START.md"
echo ""
