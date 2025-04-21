#!/bin/bash

# Exit on error
set -e

# Build both applications
echo "Building applications..."
npm run build

# Configuration
VANGUS_USER="your-vangus-username"
VANGUS_HOST="your-vangus-host"
REMOTE_PATH="/var/www/loveable-monorepo"

# Create remote directories if they don't exist
echo "Creating remote directories..."
ssh $VANGUS_USER@$VANGUS_HOST "mkdir -p $REMOTE_PATH/{landing,form}/dist"

# Deploy landing page
echo "Deploying landing page..."
rsync -avz --delete landing/dist/ $VANGUS_USER@$VANGUS_HOST:$REMOTE_PATH/landing/dist/

# Deploy form application
echo "Deploying form application..."
rsync -avz --delete form/dist/ $VANGUS_USER@$VANGUS_HOST:$REMOTE_PATH/form/dist/

# Create Nginx configuration if it doesn't exist
echo "Checking Nginx configuration..."
NGINX_CONFIG="server {
    listen 80;
    server_name your-domain.com;

    # Landing page
    location / {
        root $REMOTE_PATH/landing/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Form application
    location /form {
        alias $REMOTE_PATH/form/dist;
        try_files \$uri \$uri/ /form/index.html;
    }
}"

# Upload Nginx configuration if it doesn't exist
ssh $VANGUS_USER@$VANGUS_HOST "[ -f /etc/nginx/sites-available/loveable ] || echo \"$NGINX_CONFIG\" | sudo tee /etc/nginx/sites-available/loveable"

# Enable site if not already enabled
ssh $VANGUS_USER@$VANGUS_HOST "[ -L /etc/nginx/sites-enabled/loveable ] || sudo ln -s /etc/nginx/sites-available/loveable /etc/nginx/sites-enabled/"

# Reload Nginx
echo "Reloading Nginx..."
ssh $VANGUS_USER@$VANGUS_HOST "sudo nginx -t && sudo systemctl reload nginx"

echo "Deployment completed successfully!" 