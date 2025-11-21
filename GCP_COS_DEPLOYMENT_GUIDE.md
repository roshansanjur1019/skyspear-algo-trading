# GCP Container-Optimized OS Deployment Guide

## 🎯 Overview

This guide covers deploying to Google Cloud Platform (GCP) using Container-Optimized OS (COS), which is optimized for running Docker containers.

## 🔑 Key Differences: COS vs Regular Linux

### Container-Optimized OS Characteristics:
- ✅ **Docker pre-installed** - No need to install Docker
- ✅ **Read-only root filesystem** - Only `/var` and `/home` are writable
- ✅ **No package manager** - Can't use `apt` or `yum`
- ✅ **Minimal OS** - Optimized for containers only
- ✅ **Automatic updates** - Managed by Google

## 📋 Prerequisites

### 1. **GCP VM Instance Setup**

Create a VM with Container-Optimized OS:

```bash
# Using gcloud CLI
gcloud compute instances create skyspear-vm \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --machine-type=e2-medium \
  --zone=us-central1-a \
  --tags=http-server,https-server \
  --metadata=startup-script='#! /bin/bash
    sudo systemctl start docker
    sudo systemctl enable docker'
```

Or via GCP Console:
1. Go to Compute Engine → VM instances
2. Click "Create Instance"
3. **Boot disk**: 
   - OS: Container-Optimized OS
   - Version: cos-stable (or cos-dev for latest)
4. **Machine type**: e2-medium or higher
5. **Firewall**: Allow HTTP and HTTPS traffic
6. **Network tags**: `http-server`, `https-server`

### 2. **Static IP Address**

Reserve a static IP for your VM:

```bash
# Reserve static IP
gcloud compute addresses create skyspear-ip \
  --region=us-central1

# Get the IP
gcloud compute addresses describe skyspear-ip \
  --region=us-central1

# Attach to VM
gcloud compute instances add-access-config skyspear-vm \
  --access-config-name="External NAT" \
  --address=YOUR_STATIC_IP \
  --zone=us-central1-a
```

Or via Console:
1. Go to VPC network → External IP addresses
2. Reserve a new static IP
3. Attach it to your VM instance

### 3. **Firewall Rules**

Ensure these ports are open:

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Allow HTTPS
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags https-server

# Allow SSH
gcloud compute firewall-rules create allow-ssh \
  --allow tcp:22 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server
```

Or via Console:
1. Go to VPC network → Firewall
2. Create rules for ports 80, 443, 22

### 4. **SSH Access Setup**

#### Option A: Using SSH Keys (Recommended)

Generate SSH key pair:

```bash
# Generate key pair
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/gcp_deploy_key

# Add public key to GCP VM
gcloud compute instances add-metadata skyspear-prod \
  --metadata-from-file ssh-keys=~/.ssh/gcp_deploy_key.pub \
  --zone=asia-south1-b
```

Add private key to GitHub Secrets:
- Go to GitHub → Settings → Secrets and variables → Actions
- Add secret: `SSH_PRIVATE_KEY` = contents of `~/.ssh/gcp_deploy_key`

#### Option B: Using OS Login (Alternative)

```bash
# Enable OS Login
gcloud compute instances add-metadata skyspear-vm \
  --metadata enable-oslogin=TRUE \
  --zone=us-central1-a

# Grant IAM role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/compute.osLogin"
```

### 5. **GitHub Secrets Configuration**

Update these secrets in GitHub:

```
SSH_HOST = <GCP_VM_EXTERNAL_IP>
SSH_USER = <username> (usually your GCP username or 'user' for COS)
SSH_PRIVATE_KEY = <private_key_contents>
SSH_PORT = 22
ANGEL_ONE_PUBLIC_IP = <GCP_STATIC_IP>
ANGEL_ONE_LOCAL_IP = <GCP_VM_INTERNAL_IP>
DOMAIN = skyspear.in
SUPABASE_URL = <your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY = <your_key>
SUPABASE_ANON_KEY = <your_key>
SUPABASE_JWT_SECRET = <your_secret>
GEMINI_API_KEY = <your_key>
ANGEL_ONE_API_KEY = <your_key>
ANGEL_ONE_API_SECRET = <your_secret>
ANGEL_ONE_CLIENT_ID = <your_id>
ANGEL_ONE_PASSWORD = <your_password>
ANGEL_ONE_TOTP_SECRET = <your_secret>
```

## 🚀 Deployment Process

### Automatic Deployment

The GitHub Actions workflow will:

1. **Connect via SSH** to GCP VM
2. **Verify Docker** (already installed in COS)
3. **Install Docker Compose** (if not present)
4. **Clone/Update Repository** in `~/apps/nifty-stride-trader`
5. **Create Environment Files** (`.env.angelone`, `.env.hosting`)
6. **Clean Docker** (free disk space)
7. **Build Images** (frontend, trading-worker)
8. **Start Containers** (all services)

### Manual Deployment (If Needed)

```bash
# SSH into GCP VM
gcloud compute ssh skyspear-vm --zone=us-central1-a

# Or using regular SSH
ssh -i ~/.ssh/gcp_deploy_key user@<GCP_VM_IP>

# Navigate to app directory
cd ~/apps/nifty-stride-trader

# Pull latest code
git pull origin main

# Rebuild and restart
sudo docker compose --env-file .env.angelone --env-file .env.hosting build --no-cache
sudo docker compose --env-file .env.angelone --env-file .env.hosting up -d
```

## 🔧 Container-Optimized OS Specific Notes

### 1. **Writable Directories**

Only these directories are writable:
- `/home/<user>/` - User home directory
- `/var/` - Variable data
- `/tmp/` - Temporary files

**Solution**: Store app code in `~/apps/` (home directory)

### 2. **Docker Compose Installation**

COS doesn't have a package manager, so we install Docker Compose manually:

```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### 3. **Docker Service**

Docker is pre-installed but may need to be started:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 4. **Disk Space Management**

COS has limited disk space. Regular cleanup is important:

```bash
# Clean up Docker
sudo docker system prune -af --volumes
sudo docker builder prune -af

# Check disk usage
df -h
```

### 5. **Logs Location**

Docker logs are stored in:
- `/var/log/docker/` - Docker daemon logs
- Container logs: `docker compose logs`

## 🐛 Troubleshooting

### Issue: "Permission denied" when running Docker

**Solution**: Use `sudo` for Docker commands in COS:
```bash
sudo docker compose ...
```

### Issue: "No space left on device"

**Solution**: Clean up Docker:
```bash
sudo docker system prune -af --volumes
sudo docker builder prune -af
```

### Issue: "Cannot connect to Docker daemon"

**Solution**: Start Docker service:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Issue: "docker-compose: command not found"

**Solution**: Install Docker Compose plugin:
```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### Issue: SSH connection fails

**Solution**: 
1. Check firewall rules allow port 22
2. Verify SSH key is added to VM metadata
3. Check VM has external IP
4. Verify `SSH_USER` in GitHub secrets (try `user` for COS)

## ✅ Verification Checklist

After deployment, verify:

- [ ] Containers are running: `sudo docker compose ps`
- [ ] Trading worker logs: `sudo docker compose logs trading-worker`
- [ ] Frontend accessible: `curl https://skyspear.in`
- [ ] API accessible: `curl https://api.skyspear.in`
- [ ] Environment variables set: `cat ~/apps/nifty-stride-trader/.env.angelone`
- [ ] Disk space available: `df -h`
- [ ] Docker service running: `sudo systemctl status docker`

## 📊 Monitoring

### View Container Logs

```bash
# All services
sudo docker compose logs

# Specific service
sudo docker compose logs trading-worker
sudo docker compose logs frontend

# Follow logs
sudo docker compose logs -f trading-worker
```

### Check Container Status

```bash
sudo docker compose ps
sudo docker ps -a
```

### Resource Usage

```bash
# Container stats
sudo docker stats

# Disk usage
df -h
du -sh ~/apps/nifty-stride-trader
```

## 🔄 Updating Deployment

The GitHub Actions workflow automatically deploys on every push to `main` branch.

To manually trigger:
1. Go to GitHub → Actions
2. Select "Deploy to GCP Instance"
3. Click "Run workflow"

## 🎯 Summary

**Key Points:**
- ✅ COS has Docker pre-installed
- ✅ Use `~/apps/` for app code (writable)
- ✅ Use `sudo` for Docker commands
- ✅ Install Docker Compose manually
- ✅ Regular Docker cleanup needed
- ✅ SSH access via keys or OS Login

**The deployment workflow is now configured for GCP Container-Optimized OS!** 🚀

gcloud projects add-iam-policy-binding skyspear-001 \
  --member="user:skyspearsolutions@gmail.com" \
  --role="roles/compute.instanceAdmin.v1"

  gcloud projects add-iam-policy-binding skyspear-001 \
  --member="serviceAccount:716702365478-compute@developer.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"