# Manual Deployment Guide

This guide explains how to deploy the **PingOrder** application manually on a Linux server without Docker. This is essential for understanding how Nginx and Node.js interact.

## 1. Prerequisites
- A Linux server (e.g., Ubuntu)
- Node.js (v18+) and NPM
- PostgreSQL and Redis installed and running

## 2. Setup PostgreSQL

You have two main options for setting up the database.

### Option A: Manual Installation (on Ubuntu/Debian)
```bash
# Install Postgres
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a user and database
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE pingorder;"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"

# Initialize the schema
sudo -u postgres psql -d pingorder -f /path/to/pingorder/postgres/init.sql
```

### Option B: Using Docker (Single Container)
If you just want the DB in a container while running the app manually:
```bash
docker run --name pingorder-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pingorder \
  -p 5432:5432 \
  -v $(pwd)/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql \
  -d postgres:15
```

## 3. Prepare the Application
Clone the code to your server and navigate to the `app` directory.

```bash
cd pingorder/app
npm install
```

## 4. Configure Environment Variables
The app uses environment variables for configuration. You can export them or use a `.env` file.

```bash
export PORT=3000
export DATABASE_URL=postgresql://user:pass@localhost:5432/pingorder
export SESSION_BACKEND=memory # or redis
```

## 5. Run with a Process Manager (PM2)
In production, you don't use `node server.js` directly because it would stop if you close your terminal or if the app crashes. Use **PM2**.

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start server.js --name "pingorder-app"

# Ensure it starts on reboot
pm2 startup
pm2 save
```

## 6. Configure Nginx as a Reverse Proxy
Nginx will listen on port 80 (HTTP) and "forward" requests to your Node app on port 3000.

### Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### Create a Configuration File
Create `/etc/nginx/sites-available/pingorder`:

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        proxy_pass http://localhost:3000; # Forwarding to Node.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/pingorder /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```

## 7. Verification
Visit your server's IP address. You should see the PingOrder login page.

### Key Concepts
- **Reverse Proxy**: Nginx sits in front of the app. It handles SSL, caching, and buffering, protecting the Node.js process.
- **Process Management**: PM2 keeps the app alive and handles logs.
- **Decoupling**: The app doesn't know about Nginx; it just listens on a local port.
