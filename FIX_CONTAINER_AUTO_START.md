# Fix: Containers Not Starting After VM Reboot

## 🔍 Problem

After stopping and starting the VM:
- Frontend container is stopped (Exited)
- Angel-one container is stopped (Exited)
- Nginx keeps restarting (can't find frontend)
- Only trading-worker is running

## ✅ Immediate Fix

**SSH into your server and run:**

```bash
cd /opt/nifty-stride-trader

# Start all stopped containers
docker compose up -d

# Check status
docker compose ps
```

All containers should start now.

## 🔧 Root Cause Fix: Auto-Start on Reboot

### Option 1: Update docker-compose.yml (Recommended)

All services should have `restart: unless-stopped` to auto-start on VM reboot.

### Option 2: Create Systemd Service

Create a systemd service to auto-start Docker Compose on boot.

## 📋 Quick Fix Commands

**On your server right now:**

```bash
cd /opt/nifty-stride-trader

# 1. Start all containers
docker compose up -d

# 2. Verify all are running
docker compose ps

# 3. Check logs if any issues
docker compose logs --tail=50
```

