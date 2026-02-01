# DNS Configuration Guide for api.rent-swarm.tech

This guide explains how to configure DNS records to point your domain `api.rent-swarm.tech` to your EC2 instance.

## Overview

You need to create an **A Record** that points `api.rent-swarm.tech` to your EC2 instance's public IP address.

**Required Information:**
- Domain: `rent-swarm.tech`
- Subdomain: `api`
- EC2 Public IP: (Get from AWS EC2 Console, e.g., `54.123.45.67`)

---

## Step 1: Find Your EC2 Public IP

1. Log into AWS Console
2. Go to EC2 Dashboard
3. Click on your instance
4. Find **Public IPv4 address** in the details panel
5. Copy this IP address (e.g., `54.123.45.67`)

---

## Step 2: Configure DNS Records

Follow the instructions for your domain registrar:

### Option A: Generic Instructions (Works for most registrars)

1. **Log into your domain registrar** where you purchased `rent-swarm.tech`
   - Common registrars: GoDaddy, Namecheap, Google Domains, Cloudflare, etc.

2. **Navigate to DNS Management**
   - Look for: "DNS Settings", "Manage DNS", "DNS Records", or "Zone File"

3. **Add a new A Record**:
   - **Type**: `A` (or `A Record`)
   - **Host/Name**: `api` (this creates api.rent-swarm.tech)
   - **Points to/Value**: Your EC2 Public IP (e.g., `54.123.45.67`)
   - **TTL**: `3600` (1 hour) or leave as default

4. **Save the record**

5. **Wait for propagation** (5-60 minutes)

---

### Option B: Specific Registrar Instructions

#### GoDaddy

1. Log into GoDaddy account
2. Go to **My Products**
3. Next to **Domains**, click **DNS**
4. Select your domain `rent-swarm.tech`
5. Click **Add** under Records
6. Configure:
   - Type: `A`
   - Name: `api`
   - Value: `YOUR_EC2_IP`
   - TTL: `1 Hour`
7. Click **Save**

#### Namecheap

1. Log into Namecheap account
2. Go to **Domain List**
3. Click **Manage** next to `rent-swarm.tech`
4. Click **Advanced DNS** tab
5. Click **Add New Record**
6. Configure:
   - Type: `A Record`
   - Host: `api`
   - Value: `YOUR_EC2_IP`
   - TTL: `Automatic`
7. Click the green checkmark to save

#### Google Domains / Google Cloud DNS

1. Log into Google Domains
2. Select your domain `rent-swarm.tech`
3. Click **DNS** in the left menu
4. Scroll to **Custom resource records**
5. Add record:
   - Name: `api`
   - Type: `A`
   - TTL: `1h`
   - Data: `YOUR_EC2_IP`
6. Click **Add**

#### Cloudflare

1. Log into Cloudflare
2. Select your domain `rent-swarm.tech`
3. Click **DNS** in the left menu
4. Click **Add record**
5. Configure:
   - Type: `A`
   - Name: `api`
   - IPv4 address: `YOUR_EC2_IP`
   - Proxy status: Can be either (Orange = Proxied, Gray = DNS only)
     - **Recommended**: Gray (DNS only) for initial setup
   - TTL: `Auto`
6. Click **Save**

**Note**: If using Cloudflare's proxy (Orange cloud):
- Cloudflare will handle SSL automatically
- You may need to adjust your Caddyfile configuration
- For simplicity, start with "DNS only" (Gray cloud)

#### Route 53 (AWS)

If you want to use AWS Route 53 for DNS:

1. Go to Route 53 Console
2. Click **Hosted zones**
3. Create hosted zone for `rent-swarm.tech` (if not exists)
4. Click **Create record**
5. Configure:
   - Record name: `api`
   - Record type: `A`
   - Value: `YOUR_EC2_IP`
   - TTL: `300`
   - Routing policy: `Simple routing`
6. Click **Create records**

**Important**: If using Route 53, you need to update your domain's nameservers at your registrar to point to Route 53's nameservers.

---

## Step 3: Verify DNS Configuration

### Using Command Line

**Linux/Mac (nslookup)**:
```bash
nslookup api.rent-swarm.tech
```

**Linux/Mac (dig)**:
```bash
dig api.rent-swarm.tech
```

**Windows (nslookup)**:
```cmd
nslookup api.rent-swarm.tech
```

**Expected Output**:
```
Server:    8.8.8.8
Address:   8.8.8.8#53

Non-authoritative answer:
Name:      api.rent-swarm.tech
Address:   54.123.45.67
```

The `Address` should match your EC2 public IP.

### Using Online Tools

1. **DNS Checker**: https://dnschecker.org/
   - Enter: `api.rent-swarm.tech`
   - Type: `A`
   - Click **Search**
   - Check multiple locations

2. **What's My DNS**: https://whatsmydns.net/
   - Enter: `api.rent-swarm.tech`
   - Type: `A`
   - Shows propagation worldwide

---

## Step 4: Wait for Propagation

DNS changes can take time to propagate globally:
- **Minimum**: 5-10 minutes
- **Typical**: 30-60 minutes
- **Maximum**: 24-48 hours (rare)

**During propagation**:
- Some locations may see the old records
- Some may see the new records
- This is normal

**Tips to speed up**:
- Use a low TTL (3600 seconds)
- Clear your local DNS cache
- Use Google's DNS (8.8.8.8) to test

---

## Step 5: Test the Setup

Once DNS has propagated:

### Test from Command Line

```bash
# Test DNS resolution
curl -I https://api.rent-swarm.tech

# Should return HTTP 200 or 301/302 redirect
```

### Test in Browser

1. Open browser
2. Navigate to: `https://api.rent-swarm.tech`
3. Should see your application with a valid SSL certificate

---

## Common DNS Configurations

### Configuration 1: Single Subdomain (Recommended)

What we're setting up:
- `api.rent-swarm.tech` → EC2 IP (Your application)

DNS Records:
```
Type    Name    Value           TTL
A       api     YOUR_EC2_IP     3600
```

### Configuration 2: Multiple Subdomains

If you want multiple subdomains:
- `api.rent-swarm.tech` → EC2 IP (API)
- `app.rent-swarm.tech` → EC2 IP (Frontend)
- `www.rent-swarm.tech` → EC2 IP (Website)

DNS Records:
```
Type    Name    Value           TTL
A       api     YOUR_EC2_IP     3600
A       app     YOUR_EC2_IP     3600
A       www     YOUR_EC2_IP     3600
```

Then update Caddyfile to handle multiple domains.

### Configuration 3: Apex Domain + Subdomain

If you want both root and subdomain:
- `rent-swarm.tech` → EC2 IP
- `api.rent-swarm.tech` → EC2 IP

DNS Records:
```
Type    Name    Value           TTL
A       @       YOUR_EC2_IP     3600
A       api     YOUR_EC2_IP     3600
```

(`@` represents the root/apex domain)

---

## Troubleshooting

### DNS Not Resolving

**Problem**: `nslookup api.rent-swarm.tech` doesn't return your EC2 IP

**Solutions**:
1. Wait longer (up to 60 minutes)
2. Check that you created an **A record**, not CNAME
3. Verify the record name is exactly `api`
4. Verify you saved the changes
5. Clear your local DNS cache:
   - **Windows**: `ipconfig /flushdns`
   - **Mac**: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - **Linux**: `sudo systemd-resolve --flush-caches`

### SSL Certificate Not Working

**Problem**: Browser shows "Not Secure" or SSL error

**Solutions**:
1. Ensure DNS is fully propagated first
2. Check Caddy logs: `docker-compose logs caddy`
3. Verify ports 80 and 443 are open in Security Group
4. Make sure no other service is using port 80/443
5. Restart Caddy: `docker-compose restart caddy`

### Domain Works But Shows Wrong Content

**Problem**: Domain loads but shows wrong application

**Solutions**:
1. Check if another service is running on port 80/443
2. Verify Caddyfile has correct domain name
3. Restart all services: `docker-compose restart`

### EC2 IP Changed

**Problem**: EC2 instance was stopped/started and IP changed

**Solutions**:
1. **Short-term**: Update DNS A record with new IP
2. **Long-term**: Allocate an Elastic IP (AWS):
   - Go to EC2 → Elastic IPs
   - Click **Allocate Elastic IP address**
   - Select the Elastic IP
   - Click **Actions** → **Associate Elastic IP address**
   - Select your instance
   - Click **Associate**
   - Update DNS with this permanent IP

---

## Using Elastic IP (Recommended for Production)

To prevent IP changes when stopping/starting EC2:

1. **Allocate Elastic IP**:
   - AWS Console → EC2 → Elastic IPs
   - Click **Allocate Elastic IP address**
   - Click **Allocate**

2. **Associate with EC2 Instance**:
   - Select the new Elastic IP
   - Actions → Associate Elastic IP address
   - Select your instance
   - Click **Associate**

3. **Update DNS**:
   - Use the Elastic IP in your DNS A record
   - This IP won't change even if you stop/start the instance

**Note**: Elastic IPs are free while associated with a running instance. You're charged if the Elastic IP is allocated but not associated with a running instance.

---

## Advanced: Using CNAME Records

### When to Use CNAME vs A Record

**Use A Record** (Recommended):
- Direct mapping to IP address
- Better performance
- Required for apex/root domains
- What we use: `api.rent-swarm.tech` → `54.123.45.67`

**Use CNAME**:
- Pointing to another domain
- If using load balancer or CDN
- Example: `api.rent-swarm.tech` → `myapp.us-east-1.elb.amazonaws.com`

### Setting Up Load Balancer (Future Enhancement)

If you later add an AWS Application Load Balancer:

1. Create ALB in AWS
2. Note the ALB DNS name (e.g., `myapp-123456.us-east-1.elb.amazonaws.com`)
3. Change DNS record from A to CNAME:
   - Type: `CNAME`
   - Name: `api`
   - Value: `myapp-123456.us-east-1.elb.amazonaws.com`

---

## Summary Checklist

- [ ] Found EC2 public IP address
- [ ] Logged into domain registrar
- [ ] Added A record: `api` → `YOUR_EC2_IP`
- [ ] Saved DNS changes
- [ ] Waited for propagation (5-60 minutes)
- [ ] Verified with `nslookup api.rent-swarm.tech`
- [ ] Verified with online DNS checker
- [ ] Tested in browser: `https://api.rent-swarm.tech`
- [ ] SSL certificate automatically obtained by Caddy
- [ ] Application loads correctly

---

## Next Steps

After DNS is configured and working:
1. Deploy your application: [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md)
2. Set up monitoring and alerts
3. Configure automated backups
4. Consider allocating an Elastic IP for production

---

## Support Resources

- **DNS Propagation Checker**: https://dnschecker.org/
- **What's My DNS**: https://whatsmydns.net/
- **AWS Route 53 Documentation**: https://docs.aws.amazon.com/route53/
- **Cloudflare DNS Documentation**: https://developers.cloudflare.com/dns/

---

For deployment instructions after DNS is configured, see:
- [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference
