# Disk Space Issue Fix

## Problem
The EC2 instance ran out of disk space during Docker build:
```
ENOSPC: no space left on device
```

## Solution
Added Docker cleanup steps to the deployment script to free up disk space before building.

## Changes Made

### Updated `.github/workflows/deploy.yml`
Added cleanup commands before building:
```bash
# Clean up Docker to free disk space
sudo docker system prune -af --volumes
sudo docker builder prune -af
```

## What Gets Cleaned

1. **`docker system prune -af --volumes`**:
   - Removes all stopped containers
   - Removes all unused images (not just dangling)
   - Removes all unused volumes
   - Removes all unused networks
   - `-a` = all, not just dangling
   - `-f` = force, no confirmation

2. **`docker builder prune -af`**:
   - Removes all build cache
   - Frees up significant space from previous builds

## Disk Space Check

The script also includes `df -h` to show disk usage before building, which helps monitor space.

## Manual Cleanup (if needed)

If you need to manually free space on the EC2 instance:

```bash
# SSH into EC2 instance
ssh user@your-ec2-instance

# Check disk space
df -h

# Clean Docker
sudo docker system prune -af --volumes
sudo docker builder prune -af

# Check space again
df -h

# If still low, check what's using space
sudo du -sh /var/lib/docker/*
sudo du -sh /tmp/*
sudo du -sh /var/log/*

# Clean old logs (if needed)
sudo journalctl --vacuum-time=7d
```

## Prevention

The deployment script now automatically cleans up before each build, which should prevent this issue from recurring.

## Expected Behavior

On each deployment:
1. ✅ Clean up old Docker images/containers/volumes
2. ✅ Clean up build cache
3. ✅ Show disk space
4. ✅ Build new containers
5. ✅ Start services

This ensures there's always enough space for new builds.

