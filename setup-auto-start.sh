#!/bin/bash
# Setup systemd service to auto-start Docker Compose on VM reboot

set -e

SERVICE_NAME="nifty-stride-trader"
WORK_DIR="/opt/nifty-stride-trader"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "Setting up auto-start service for Docker Compose..."

# Create systemd service file
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Nifty Stride Trader Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${WORK_DIR}
ExecStart=/usr/bin/docker compose --env-file .env.angelone --env-file .env.hosting up -d
ExecStop=/usr/bin/docker compose --env-file .env.angelone --env-file .env.hosting down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable ${SERVICE_NAME}.service

echo "✅ Auto-start service created and enabled"
echo ""
echo "Service will start containers on VM reboot"
echo ""
echo "To start now: sudo systemctl start ${SERVICE_NAME}"
echo "To check status: sudo systemctl status ${SERVICE_NAME}"
echo "To view logs: sudo journalctl -u ${SERVICE_NAME} -f"

