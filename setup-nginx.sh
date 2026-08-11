#!/bin/bash
# Run this ONCE on the EC2 server to set up Nginx reverse proxy for backend.natsoft.io
# Usage: ssh -i key.pem ubuntu@18.234.111.185 'bash -s' < setup-nginx.sh

set -e

echo "Installing Nginx..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "Writing Nginx config for backend.natsoft.io..."
sudo tee /etc/nginx/sites-available/hrms-backend > /dev/null << 'NGINX'
server {
    listen 80;
    server_name backend.natsoft.io;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 20M;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/hrms-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "Obtaining SSL certificate for backend.natsoft.io..."
sudo certbot --nginx -d backend.natsoft.io --non-interactive --agree-tos -m admin@natsoft.io

echo "Enabling Nginx on boot..."
sudo systemctl enable nginx

echo "✅ Nginx + SSL configured for https://backend.natsoft.io"
