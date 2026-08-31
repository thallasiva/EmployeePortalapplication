/**
 * SSH Fix Server - Updates .env on production server and restarts PM2
 * Run from: C:\TimeSheet\humanresourceshradmintemplate\backend\database\
 * Command:   node ssh_fix_server.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const SERVER = '18.234.111.185';
const USER = 'ubuntu';
const BACKEND_PATH = '/var/EmployeePortalapplication/backend';

// Common SSH key locations
const KEY_LOCATIONS = [
  path.join(os.homedir(), '.ssh', 'id_rsa'),
  path.join(os.homedir(), '.ssh', 'id_ed25519'),
  path.join(os.homedir(), 'natsoft.pem'),
  path.join(os.homedir(), 'hrms.pem'),
  path.join(os.homedir(), 'Downloads', 'natsoft.pem'),
  path.join(os.homedir(), 'Downloads', 'hrms.pem'),
  path.join(os.homedir(), 'Downloads', 'ubuntu.pem'),
  path.join(os.homedir(), 'Downloads', 'ec2.pem'),
  path.join(os.homedir(), 'Desktop', 'natsoft.pem'),
  'C:\\TimeSheet\\natsoft.pem',
  'C:\\TimeSheet\\hrms.pem',
];

function findKey() {
  console.log('Searching for SSH key...');
  for (const loc of KEY_LOCATIONS) {
    if (fs.existsSync(loc)) {
      console.log('Found key: ' + loc);
      return loc;
    }
  }
  return null;
}

function runSSH(keyPath, cmd) {
  const full = `ssh -o StrictHostKeyChecking=no -i "${keyPath}" ${USER}@${SERVER} "${cmd}"`;
  console.log('\nRunning: ' + cmd);
  try {
    const out = execSync(full, { encoding: 'utf8', timeout: 30000 });
    if (out) console.log(out);
    return out;
  } catch (e) {
    console.error('Error: ' + e.message);
    throw e;
  }
}

async function askKey() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('\nEnter full path to your SSH .pem key file: ', ans => {
      rl.close();
      resolve(ans.trim().replace(/^["']|["']$/g, ''));
    });
  });
}

async function main() {
  console.log('='.repeat(55));
  console.log('HRMS Production Server Fix');
  console.log('Server: backend.natsoft.io (' + SERVER + ')');
  console.log('='.repeat(55));

  let keyPath = findKey();
  if (!keyPath) {
    console.log('\nNo key found automatically in common locations.');
    keyPath = await askKey();
    if (!fs.existsSync(keyPath)) {
      console.error('File not found: ' + keyPath);
      process.exit(1);
    }
  }

  // Fix permissions (Windows OpenSSH requirement)
  try {
    execSync(`icacls "${keyPath}" /inheritance:r /grant:r "%USERNAME%":R`, { shell: true, stdio: 'ignore' });
  } catch(e) {}

  console.log('\n[1/5] Checking current DB config...');
  runSSH(keyPath, `grep ^DB_ ${BACKEND_PATH}/.env`);

  console.log('\n[2/5] Backing up .env...');
  runSSH(keyPath, `cp ${BACKEND_PATH}/.env ${BACKEND_PATH}/.env.bak`);

  console.log('\n[3/5] Updating .env to point to RDS...');
  const updateCmd = [
    `sed -i 's|^DB_HOST=.*|DB_HOST=hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com|' ${BACKEND_PATH}/.env`,
    `sed -i 's|^DB_PORT=.*|DB_PORT=4306|' ${BACKEND_PATH}/.env`,
    `sed -i 's|^DB_USER=.*|DB_USER=HRMSadmin|' ${BACKEND_PATH}/.env`,
    `sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=HwULGJ6gbxQIhzwNeZ9L|' ${BACKEND_PATH}/.env`,
    `sed -i 's|^DB_NAME=.*|DB_NAME=hrms_db|' ${BACKEND_PATH}/.env`,
  ].join(' && ');
  runSSH(keyPath, updateCmd);

  console.log('\n[4/5] Verifying new .env...');
  runSSH(keyPath, `grep ^DB_ ${BACKEND_PATH}/.env`);

  console.log('\n[5/5] Restarting PM2...');
  runSSH(keyPath, `pm2 restart all && sleep 3 && pm2 list`);

  console.log('\n' + '='.repeat(55));
  console.log('Done! Testing login API from server...');
  runSSH(keyPath, `curl -s -w "\\nHTTP: %{http_code}" -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@yopmail.com","password":"Admin@123"}'`);

  console.log('\nNow test in Postman:');
  console.log('POST https://backend.natsoft.io/api/auth/login');
  console.log('Body: {"email":"admin@yopmail.com","password":"Admin@123"}');
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
