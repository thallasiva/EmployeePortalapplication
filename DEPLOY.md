# HRMS Deployment Guide
## Railway (Backend + MySQL) + Vercel (Frontend)

---

## Architecture

```
Browser → Vercel (React)  →  Railway (Express API)  →  Railway (MySQL)
```

---

## Step 1 — Push Code to GitHub

1. Create a new GitHub repository (e.g. `hrms-app`)
2. In your project folder, run:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hrms-app.git
git push -u origin main
```

> **Important:** `backend/.env` is in `.gitignore` — never commit it. You'll set env vars in Railway's dashboard.

---

## Step 2 — Set Up Railway MySQL Database

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Add a service** → **Database** → **MySQL**
3. Once provisioned, click the MySQL service → **Variables** tab
4. Copy these values — you'll need them in Step 3:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - Or just copy the full `DATABASE_URL` (mysql://user:pass@host:port/db)

---

## Step 3 — Deploy Backend to Railway

1. In the same Railway project, click **Add a service** → **GitHub Repo**
2. Select your `hrms-app` repo
3. Railway will detect the `backend/` folder. Set the **Root Directory** to `backend`
4. Railway auto-detects Node.js via `package.json` and uses `npm start`

### Set Environment Variables (Railway → Service → Variables tab)

```
NODE_ENV=production
PORT=5000

# Database — paste from Step 2 (use DATABASE_URL OR individual vars)
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE

# OR individual vars:
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=railway

# JWT — generate strong secrets:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-char-hex>
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=<64-char-hex>
JWT_REFRESH_EXPIRES_IN=7d

# Salary encryption key (32-byte hex = 64 chars):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SALARY_ENCRYPTION_KEY=<64-char-hex>

# CORS — set AFTER you know your Vercel URL (Step 4)
# Multiple URLs comma-separated:
CLIENT_ORIGIN=https://hrms-app.vercel.app

# Email (optional — leave blank to disable email features)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=HRMS <no-reply@hrms.app>
```

5. Click **Deploy** — Railway builds and starts your backend
6. Once deployed, copy the **public URL** (e.g. `https://hrms-api.up.railway.app`)

---

## Step 4 — Initialise the Database

After the backend is running, run the DB init script **once** to create tables and seed data.

### Option A — Via Railway's built-in shell

1. Railway → your backend service → **Shell** tab
2. Run:
```bash
node src/database/initDb.js
```

### Option B — From your local machine

1. Set your local `.env` to point at Railway MySQL:
```env
DB_HOST=<railway-mysql-host>
DB_PORT=<railway-mysql-port>
DB_USER=<railway-mysql-user>
DB_PASSWORD=<railway-mysql-password>
DB_NAME=railway
SALARY_ENCRYPTION_KEY=<same-key-as-step-3>
```
2. Run:
```bash
cd backend
node src/database/initDb.js
```

This runs all migrations and seeds in order. It's safe to run multiple times — already-existing tables are skipped.

---

## Step 5 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo `hrms-app`
3. Set **Framework Preset** to `Create React App`
4. Set **Root Directory** to `/` (the repo root, not backend)
5. Set **Build Command** to `CI=false npm run build`
6. Set **Output Directory** to `build`

### Set Environment Variables (Vercel → Project → Settings → Environment Variables)

```
REACT_APP_API_URL=https://hrms-api.up.railway.app/api
```

> Replace `hrms-api.up.railway.app` with your actual Railway backend URL from Step 3.

7. Click **Deploy**
8. Vercel gives you a URL like `https://hrms-app.vercel.app`

---

## Step 6 — Update CORS on Railway

Now that you have your Vercel URL:

1. Railway → Backend service → Variables
2. Update `CLIENT_ORIGIN`:
```
CLIENT_ORIGIN=https://hrms-app.vercel.app
```
3. Railway auto-redeploys

---

## Step 7 — Verify

1. Open `https://hrms-app.vercel.app`
2. Log in with: `admin@yopmail.com` / `Admin@123`
3. If login fails, check browser DevTools → Network tab for CORS or 401 errors

### Common issues

| Problem | Fix |
|---|---|
| CORS error in browser | Ensure `CLIENT_ORIGIN` on Railway exactly matches your Vercel URL (no trailing slash) |
| Login succeeds but redirects to login again | Cookie `SameSite=None` requires HTTPS on both ends — ensure Railway backend URL starts with `https://` |
| 500 errors on salary routes | `SALARY_ENCRYPTION_KEY` must be the same 64-char hex used when DB was seeded |
| DB connection refused | Check `DB_HOST`/`DATABASE_URL` vars on Railway — MySQL service must be in the **same project** |
| `initDb.js` fails on migration | Safe to ignore `ER_TABLE_EXISTS_ERROR` — means it already ran |

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@yopmail.com | Admin@123 |
| Manager | tirumalarao@yopmail.com | Admin@123 |
| Employee | seetharamaiah@yopmail.com | Admin@123 |

---

## File Uploads Note

Railway's filesystem is **ephemeral** — uploaded files (documents, avatars) are lost on redeploy.

For persistent file storage, integrate an S3-compatible service:
- **Cloudflare R2** (free tier, S3-compatible)
- **AWS S3**
- **Supabase Storage**

Update `backend/src/controllers/document.controller.js` to use `@aws-sdk/client-s3` instead of local `multer` disk storage.
