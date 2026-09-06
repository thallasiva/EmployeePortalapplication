#!/bin/bash
set -e

echo "========================================"
echo "  HRMS Backend Deploy → EC2 18.234.111.185"
echo "========================================"

SERVER_IP="18.234.111.185"
SERVER_USER="ubuntu"
APP_DIR="/home/ubuntu/app"
REPO_URL="https://github.com/thallasiva/EmployeePortalapplication.git"
BRANCH="Development"

# ── SSH Key: update this path to your actual .pem file ──────────────────────
# Common locations — try each until one works:
KEY_FILE=""
for f in \
  "/c/Users/Siva/Desktop/private_key.pem" \
  "/c/Users/Siva/Desktop/private_key" \
  "$HOME/Desktop/private_key.pem" \
  "$HOME/Desktop/private_key" \
  "$HOME/Desktop/sai-keypair.pem" \
  "$HOME/Desktop/private_key.pem" \
  "$HOME/.ssh/sai-keypair.pem" \
  "$HOME/.ssh/natsoft.pem"; do
  if [ -f "$f" ]; then KEY_FILE="$f"; break; fi
done

if [ -z "$KEY_FILE" ]; then
  echo "❌ SSH key (.pem) not found. Set KEY_FILE manually in this script."
  exit 1
fi
chmod 400 "$KEY_FILE"
echo "Using key: $KEY_FILE"

# ── Helper: run commands on remote server ────────────────────────────────────
remote() {
  ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
}

echo ""
echo "[1/6] Testing SSH connection..."
remote echo "SSH OK ✅"

echo ""
echo "[2/6] Installing dependencies on server (first time only)..."
remote bash << 'REMOTE'
  # Node.js (if not installed)
  if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  # PM2 (if not installed)
  if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2
  fi
  echo "Node: $(node -v)  NPM: $(npm -v)  PM2: $(pm2 -v)"
REMOTE

echo ""
echo "[3/6] Pulling latest code from GitHub ($BRANCH)..."
remote bash << REMOTE
  if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
  else
    mkdir -p $APP_DIR
    git clone -b $BRANCH $REPO_URL $APP_DIR
  fi
  echo "Code updated ✅"
REMOTE

echo ""
echo "[4/6] Installing backend npm packages..."
remote bash << REMOTE
  cd $APP_DIR/backend
  npm install --omit=dev
  echo "Packages installed ✅"
REMOTE

echo ""
echo "[5/6] Writing production .env on server..."
# Push the .env — fill in DB_PASSWORD and secrets below
remote bash << 'REMOTE'
cat > /home/ubuntu/app/backend/.env << 'ENV'
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=https://hrms.natsoft.io
FRONTEND_URL=https://hrms.natsoft.io

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_DB_PASSWORD_HERE
DB_NAME=hrms_db
DB_CONNECTION_LIMIT=10

JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_64CHARS
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_STRONG_SECRET
JWT_REFRESH_EXPIRES_IN=7d

SALARY_ENCRYPTION_KEY=64d14ac40a10a11264edb4d6b84ab3c7ea7558f7cca00590691958a363a0c813

UPLOAD_DIR=uploads
MAX_UPLOAD_MB=10

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=thallasiva786@gmail.com
SMTP_PASS=woqvpobsnonzsmjk
SMTP_FROM=HRMS\ <thallasiva786@gmail.com>
ENV
echo ".env written ✅"
REMOTE

echo ""
echo "[6/6] Restarting backend with PM2..."
remote bash << REMOTE
  cd $APP_DIR/backend
  # Copy ecosystem config
  cp $APP_DIR/ecosystem.config.js $APP_DIR/backend/

  # Create uploads dir if missing
  mkdir -p uploads

  # Start or reload with PM2
  if pm2 list | grep -q "hrms-backend"; then
    pm2 reload hrms-backend --update-env
  else
    pm2 start ecosystem.config.js --env production
  fi

  # Save PM2 process list so it survives reboots
  pm2 save
  sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

  echo "PM2 status:"
  pm2 list
REMOTE

echo ""
echo "✅ Backend deployed successfully!"
echo "   API: https://backend.natsoft.io/api"
echo ""
echo "💡 To check logs: ssh -i \$KEY_FILE ubuntu@$SERVER_IP 'pm2 logs hrms-backend'"
