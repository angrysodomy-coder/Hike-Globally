# Hostinger Deployment Guide: Hike-Globally + Payload CMS + PostgreSQL

This document provides a realistic, production-tested deployment roadmap for **Hike-Globally** (Vite + React frontend) and **Payload CMS 3.x** (Next.js server + PostgreSQL backend).

---

## 1. Environment Assessment: Can Your Hostinger Plan Run This?

### Plan 1: Hostinger Shared / Web Hosting (hPanel Single, Premium, Business)
- **PostgreSQL Support:** ❌ **Not Available.** Hostinger shared hosting provides MySQL/MariaDB only. There is no native PostgreSQL database service.
- **Node.js Daemon Execution:** ❌ **Not Viable.** While some Business plans offer limited Node.js via CloudLinux/Passenger, long-running Next.js/Payload CMS daemons exceed RAM limits (Payload requires ~300MB–500MB during build and runtime), and native dependencies (`sharp`) frequently fail to compile.
- **Verdict:** **Cannot run Payload CMS + PostgreSQL natively.**
  - *If you have this plan:* You can host the compiled static Vite frontend (`dist/`) on Hostinger Shared, but your PostgreSQL database and Payload CMS backend must be hosted externally (see **Architecture Option B** below).

---

### Plan 2: Hostinger VPS (KVM 1, KVM 2, KVM 4 or higher) — *RECOMMENDED*
- **Operating System:** Ubuntu 22.04 LTS or 24.04 LTS with full `root` access.
- **PostgreSQL Support:** ✅ **Full Native Support** (PostgreSQL 15 or 16 installed via `apt`).
- **Node.js Support:** ✅ **Full Support** (Node.js 20.x or 22.x LTS, PM2 process management).
- **Reverse Proxy:** ✅ **Nginx** handles SSL, serves the Vite frontend statically with microsecond latency, and proxies `/admin`, `/api`, and `/media` to Payload CMS on port 3000.
- **Verdict:** **100% Viable and Production-Grade.** This allows your preferred single-domain architecture (`https://hikeglobally.com` and `https://hikeglobally.com/admin`).

---

## 2. Option A: Full Deployment on Hostinger KVM VPS (Step-by-Step)

This setup runs everything securely on a single Hostinger VPS with Nginx, PM2, and PostgreSQL.

### Step 1: Initial Server Setup & Dependencies
SSH into your Hostinger VPS:
```bash
ssh root@YOUR_SERVER_IP
```

Update packages and install build essentials:
```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx certbot python3-certbot-nginx
```

Install Node.js 20 LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Configure basic firewall:
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

### Step 2: Install and Configure PostgreSQL
Install PostgreSQL 16:
```bash
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
```

Create database and user:
```bash
sudo -u postgres psql
```
Inside the `psql` console, run:
```sql
CREATE DATABASE hikeglobally;
CREATE USER hike_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE hikeglobally TO hike_user;
ALTER DATABASE hikeglobally OWNER TO hike_user;
\q
```

Test connection:
```bash
psql -U hike_user -d hikeglobally -h 127.0.0.1
```

---

### Step 3: Clone Project & Configure Environment Variables
Clone your repository to `/var/www/hikeglobally`:
```bash
git clone https://github.com/angrysodomy-coder/Hike-Globally.git /var/www/hikeglobally
cd /var/www/hikeglobally
```

#### A. Configure CMS Environment (`cms/.env`)
Create `/var/www/hikeglobally/cms/.env`:
```ini
PORT=3000
DATABASE_URL=postgresql://hike_user:YOUR_STRONG_PASSWORD_HERE@127.0.0.1:5432/hikeglobally
PAYLOAD_SECRET=YOUR_64_CHAR_RANDOM_SECRET_STRING_ABC123XYZ
PAYLOAD_PUBLIC_SERVER_URL=https://hikeglobally.com
PAYLOAD_CORS_ORIGIN=https://hikeglobally.com,https://www.hikeglobally.com
```
*(Generate a secret with `openssl rand -hex 32`)*

#### B. Configure Frontend Environment (`.env`)
Create `/var/www/hikeglobally/.env`:
```ini
# When served behind Nginx reverse proxy on the same domain:
VITE_PAYLOAD_URL=https://hikeglobally.com
```

---

### Step 4: Install Dependencies & Build Applications

1. **Install root and CMS dependencies:**
```bash
cd /var/www/hikeglobally
npm install
npm --prefix cms install
```

2. **Seed Initial Content (Trips, Destinations, Blogs, Categories, Admin User):**
```bash
npm --prefix cms run seed
```
> **Default Admin:** `admin@hikeglobally.com` / `password123` (Change this immediately after logging in).

3. **Build Payload CMS:**
```bash
npm --prefix cms run build
```

4. **Build Vite Frontend:**
```bash
npm run build
```
*(This produces static production files in `/var/www/hikeglobally/dist/`)*

---

### Step 5: Process Management with PM2
Create an ecosystem file `/var/www/hikeglobally/ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: 'hike-payload-cms',
      cwd: '/var/www/hikeglobally/cms',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

Start and persist with PM2:
```bash
pm2 start /var/www/hikeglobally/ecosystem.config.cjs
pm2 save
pm2 startup
```

Verify status:
```bash
pm2 status
curl -I http://127.0.0.1:3000/admin
```

---

### Step 6: Configure Nginx (Single-Domain Architecture)
Create `/etc/nginx/sites-available/hikeglobally`:
```nginx
server {
    listen 80;
    server_name hikeglobally.com www.hikeglobally.com;

    # Client body limit for media uploads
    client_max_body_size 25M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # 1. Payload CMS Admin Panel
    location /admin {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Payload REST API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Payload Next.js Internal Assets
    location /_next {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 4. Uploaded Media Files
    location /media {
        alias /var/www/hikeglobally/cms/media;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri @payload_media;
    }

    location @payload_media {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    # 5. Vite Static SPA (Frontend)
    location / {
        root /var/www/hikeglobally/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(?:css|js|woff2?|eot|ttf|otf|webp|jpg|jpeg|png|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
```

Enable site and restart Nginx:
```bash
ln -s /etc/nginx/sites-available/hikeglobally /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

### Step 7: Enable SSL Certificate
Point your DNS records (A record) to the VPS IP, then run:
```bash
certbot --nginx -d hikeglobally.com -d www.hikeglobally.com
```
Certbot will automatically install SSL and set up auto-renewal.

---

## 3. Option B: Decoupled / Hybrid Architecture (If using Hostinger Shared)

If you already own a **Hostinger Shared/Business hosting plan** and do not wish to upgrade to a VPS, follow this decoupled architecture:

```
[ Visitor Browser ]
       |
       +---> https://hikeglobally.com (Hostinger Shared or Vercel / Cloudflare Pages)
       |     [ Vite React Static Build: /dist ]
       |
       +---> https://cms.hikeglobally.com/admin (Render / Railway / Fly.io)
             [ Payload CMS Next.js Server ]
                   |
                   v
             [ PostgreSQL Database: Neon.tech or Supabase ]
```

### 1. Database: Neon Serverless PostgreSQL (Free / Low Cost)
1. Sign up at [neon.tech](https://neon.tech).
2. Create project `hikeglobally`.
3. Copy the pooled connection string:
   `postgresql://user:password@ep-xyz.aws.neon.tech/hikeglobally?sslmode=require`

### 2. CMS Backend: Render.com or Railway.app
1. Link your GitHub repository.
2. Set Root Directory to `cms`.
3. Set Build Command: `npm install && npm run build`
4. Set Start Command: `npm run start`
5. Configure Environment Variables:
   - `DATABASE_URL`: Your Neon Postgres URL
   - `PAYLOAD_SECRET`: 32+ character random string
   - `PAYLOAD_PUBLIC_SERVER_URL`: `https://cms.hikeglobally.com`
   - `PAYLOAD_CORS_ORIGIN`: `https://hikeglobally.com`
6. Add custom domain `cms.hikeglobally.com` pointing CNAME to Render/Railway.

### 3. Frontend: Hostinger Shared Hosting
1. On your local machine or CI/CD, set:
   ```ini
   VITE_PAYLOAD_URL=https://cms.hikeglobally.com
   ```
2. Run `npm run build`.
3. Upload the contents of the `dist/` folder to Hostinger hPanel File Manager under `public_html/`.
4. Ensure `.htaccess` in `public_html/` supports SPA fallback routing:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 4. Production Maintenance & Operations

### Automated PostgreSQL Backup Cron
On your VPS, set up daily database backups:
```bash
mkdir -p /var/backups/postgres
crontab -e
```
Add:
```cron
0 3 * * * pg_dump -U hike_user -h 127.0.0.1 hikeglobally | gzip > /var/backups/postgres/hike_$(date +\%Y\%m\%d).sql.gz
```

### Media Storage in Production
- By default, media is saved to `/var/www/hikeglobally/cms/media`.
- For multi-instance scaling or zero-loss deployments, install the `@payloadcms/plugin-cloud-storage` with AWS S3 or Cloudflare R2 adapter.

### Verifying Production Health
Check endpoints:
- Frontend: `curl -I https://hikeglobally.com/`
- Admin Login: `curl -I https://hikeglobally.com/admin`
- REST API: `curl -I https://hikeglobally.com/api/trips`
- Database: `psql -U hike_user -d hikeglobally -c "SELECT count(*) FROM trips;"`
