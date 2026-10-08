# OneDelivery Admin — Full Hosting Guide
## Deploy to Hostinger VPS alongside the backend

---

## Overview

The admin panel is a **React + Vite SPA** (Single Page Application). It:
- Lives at `https://onedelivery.co.tz` (or `https://admin.onedelivery.co.tz`)
- Talks exclusively to the backend at `https://api.onedelivery.co.tz/api`
- Uses JWT tokens stored in `localStorage`
- Has Socket.io real-time connection to the backend for live chat and driver tracking
- Has **no register page** — admin accounts are set directly in the database

---

## Step 1 — Local Build

### Install dependencies
```bash
cd onedelivery-admin
npm install
```

### Set environment variable
```bash
cp .env.example .env
```
Edit `.env`:
```env
VITE_API_URL=https://api.onedelivery.co.tz/api
VITE_APP_ENV=production
```

### Build for production
```bash
npm run build
```
This creates a `dist/` folder with all static files.

### Test locally before deploying
```bash
npm run preview
# Open http://localhost:4173
```

---

## Step 2 — Upload to VPS

### Option A — SCP (direct upload)
```bash
# From your local machine, inside onedelivery-admin/
scp -r dist/* deploy@YOUR_VPS_IP:/var/www/admin/
```

### Option B — Git + build on server (recommended)
```bash
# On the VPS
mkdir -p /var/www/admin
cd /var/www
git clone https://github.com/YOUR_USERNAME/onedelivery-admin.git admin-src
cd admin-src
npm install
echo "VITE_API_URL=https://api.onedelivery.co.tz/api" > .env
npm run build
cp -r dist/* /var/www/admin/
```

### Ensure correct ownership
```bash
chown -R www-data:www-data /var/www/admin
chmod -R 755 /var/www/admin
```

---

## Step 3 — Nginx Configuration

The admin can be served from the **same VPS** as the backend.

### Option A — Serve admin at onedelivery.co.tz (main domain)
```bash
nano /etc/nginx/sites-available/onedelivery.co.tz
```
```nginx
server {
    listen 80;
    server_name onedelivery.co.tz www.onedelivery.co.tz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name onedelivery.co.tz www.onedelivery.co.tz;

    ssl_certificate     /etc/letsencrypt/live/onedelivery.co.tz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/onedelivery.co.tz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/admin;
    index index.html;

    # SPA routing — all paths serve index.html (React Router handles routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache JS/CSS/images aggressively (Vite generates hashed filenames)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

### Option B — Serve admin at admin.onedelivery.co.tz (subdomain)
```bash
nano /etc/nginx/sites-available/admin.onedelivery.co.tz
```
```nginx
server {
    listen 80;
    server_name admin.onedelivery.co.tz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.onedelivery.co.tz;

    ssl_certificate     /etc/letsencrypt/live/admin.onedelivery.co.tz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.onedelivery.co.tz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### Enable the site
```bash
# Symlink whichever config you chose
ln -sf /etc/nginx/sites-available/onedelivery.co.tz /etc/nginx/sites-enabled/
# OR
ln -sf /etc/nginx/sites-available/admin.onedelivery.co.tz /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

---

## Step 4 — SSL Certificate for Admin Domain

```bash
# If serving from onedelivery.co.tz (already done in backend guide):
certbot --nginx -d onedelivery.co.tz -d www.onedelivery.co.tz

# If using admin subdomain:
certbot --nginx -d admin.onedelivery.co.tz
```

---

## Step 5 — DNS at Netpoa (if using admin subdomain)

In your Netpoa DNS panel for `onedelivery.co.tz`, add:

| Type  | Host    | Value (Points to) | TTL  |
|-------|---------|-------------------|------|
| A     | admin   | YOUR_VPS_IP       | 3600 |

If you use the main domain (`onedelivery.co.tz`), no extra DNS record is needed.

---

## Step 6 — CORS Update in Backend

Make sure your backend `.env` includes the admin domain in `CORS_ORIGIN`:

```env
# If admin is at onedelivery.co.tz:
CORS_ORIGIN=https://onedelivery.co.tz,https://www.onedelivery.co.tz

# If admin is at admin.onedelivery.co.tz:
CORS_ORIGIN=https://onedelivery.co.tz,https://admin.onedelivery.co.tz
```

Then reload the backend:
```bash
pm2 reload onedelivery-api --update-env
```

---

## Step 7 — Create First Admin Account

The admin panel has **no register page**. Admin accounts are created directly in the database.

### Method 1 — Register via API, then promote
```bash
# 1. Register a normal account via the API
curl -X POST https://api.onedelivery.co.tz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@onedelivery.co.tz","password":"YourStrongPassword123"}'

# 2. Promote to admin in MySQL
mysql -u onedelivery_user -p onedelivery
```
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@onedelivery.co.tz';
SELECT id, name, email, role FROM users WHERE email = 'admin@onedelivery.co.tz';
```

### Method 2 — Insert directly
```sql
INSERT INTO users (id, name, email, phone, password_hash, role, is_active, email_verified)
VALUES (
  UUID(),
  'Admin',
  'admin@onedelivery.co.tz',
  '+255700000000',
  -- Generate hash: node -e "const b=require('bcryptjs');b.hash('YourPassword',12).then(console.log)"
  '$2a$12$HASH_GENERATED_BY_BCRYPT_HERE',
  'admin',
  1,
  1
);
```

### Generate a bcrypt hash
```bash
# On the VPS
node -e "import('bcryptjs').then(({default:b})=>b.hash('YourStrongPassword123',12).then(console.log))"
```

---

## Step 8 — Socket.io Communication Check

The admin chat page connects to the backend via Socket.io. The connection URL is automatically derived from `VITE_API_URL` by stripping `/api`:

```
VITE_API_URL = https://api.onedelivery.co.tz/api
Socket URL   = https://api.onedelivery.co.tz
```

Make sure the Nginx config for `api.onedelivery.co.tz` has the WebSocket proxy (already included in the backend hosting guide):
```nginx
location /socket.io/ {
    proxy_pass http://onedelivery_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

---

## Step 9 — CI/CD for Admin (auto-deploy on push)

Add to `.github/workflows/deploy-admin.yml`:
```yaml
name: Deploy Admin Panel

on:
  push:
    branches: [main]
    paths: ['**']  # trigger on any change

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: https://api.onedelivery.co.tz/api
      - name: Upload to VPS
        uses: appleboy/scp-action@master
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: deploy
          key:      ${{ secrets.VPS_SSH_KEY }}
          source:   "dist/*"
          target:   "/var/www/admin"
          strip_components: 1
      - name: Reload Nginx
        uses: appleboy/ssh-action@master
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: deploy
          key:      ${{ secrets.VPS_SSH_KEY }}
          script:   sudo systemctl reload nginx
```

---

## Step 10 — Verify Everything Works

### Checklist
```
[ ] npm run build completes with no errors
[ ] dist/ folder is uploaded to /var/www/admin/ on VPS
[ ] Nginx config has try_files $uri $uri/ /index.html (SPA routing)
[ ] SSL certificate is active (https:// works)
[ ] https://onedelivery.co.tz loads the login page
[ ] Admin account exists in the database with role = 'admin'
[ ] Login works — no "Access denied" error
[ ] Dashboard shows real stats from backend
[ ] CORS_ORIGIN in backend .env includes the admin domain
[ ] Chat page connects (Socket.io) — no console CORS errors
[ ] Seller/driver applications can be approved/rejected
[ ] Withdrawals can be marked completed/failed
[ ] Broadcast notification sends successfully
```

### Test login manually
```bash
curl -X POST https://api.onedelivery.co.tz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@onedelivery.co.tz","password":"YourPassword"}'
# Should return accessToken + user with role: "admin"
```

---

## Mobile App Integration

The admin panel communicates with the same backend that the mobile apps use. No changes are needed to the mobile apps. However, ensure:

1. **Mobile apps** point `EXPO_PUBLIC_API_URL` to `https://api.onedelivery.co.tz/api`
2. **Driver app** sends location via `PUT /api/rides/driver/location` (shows on admin Deliveries page)
3. **FCM push tokens** are registered by apps on login so admin broadcasts reach them
4. **Snippe webhook** at `https://api.onedelivery.co.tz/api/payment/webhook` is configured in Snippe dashboard

---

## Troubleshooting

### Admin panel shows blank page
```bash
# Check if files are in the right place
ls /var/www/admin/index.html
# Check Nginx error log
tail -f /var/log/nginx/error.log
```

### Login gives "Access denied"
The user's role in the database is not `admin`. Fix:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@onedelivery.co.tz';
```

### Chat/Socket.io not connecting
```bash
# Check browser console for WebSocket errors
# Most common: CORS. Ensure CORS_ORIGIN in backend .env includes the admin domain
pm2 reload onedelivery-api --update-env
```

### After deploying new version, users see old cached files
Vite adds content hashes to filenames (`main-a1b2c3d4.js`), so browsers automatically
load new files. If you're still seeing old content:
```bash
# Hard refresh in browser: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Refresh on a route gives 404
This means the `try_files $uri $uri/ /index.html` line is missing from Nginx config.
Add it and reload Nginx:
```bash
nginx -t && systemctl reload nginx
```

---

## Quick Reference

| URL | What it is |
|-----|-----------|
| `https://onedelivery.co.tz` | Admin panel (login page) |
| `https://api.onedelivery.co.tz/api` | Backend REST API |
| `wss://api.onedelivery.co.tz` | WebSocket for real-time |
| `https://api.onedelivery.co.tz/api/health` | Backend health check |

| Admin Page | Backend Endpoint |
|-----------|-----------------|
| Dashboard | `GET /admin/dashboard` |
| Pending Products | `GET /admin/products?status=pending` |
| Approve Product | `PUT /admin/products/:id/approve` |
| Seller Applications | `GET /admin/seller-applications` |
| Driver Applications | `GET /admin/driver-applications` |
| Orders | `GET /admin/orders` |
| Live Deliveries | `GET /admin/deliveries` |
| Withdrawals | `GET /admin/withdrawals` |
| Broadcast | `POST /admin/broadcast` |
| Chat | `GET /chat/conversations` |

---

*OneDelivery Admin v2.0 — Production Ready*
*Stack: React 18 + Vite + TailwindCSS v4 + React Query + Socket.io*
