'use strict';
require('dotenv').config();
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:8080/callback';
const PORT          = 8080;

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}` +
  `&access_type=offline` +
  `&prompt=consent`;

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI, grant_type: 'authorization_code',
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error(data)); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') { res.end('Not found'); return; }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.end(`<h2>Error: ${error}</h2>`);
    server.close();
    return;
  }

  if (!code) { res.end('No code received'); return; }

  try {
    const tokens = await exchangeCode(code);
    if (tokens.error) {
      res.end(`<h2>Token error: ${tokens.error} — ${tokens.error_description}</h2>`);
      server.close();
      return;
    }

    const refreshToken = tokens.refresh_token;
    // Update .env
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${refreshToken}`);
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ SUCCESS! Refresh token saved to .env');
    console.log('Token:', refreshToken);
    console.log('\nNow run: node test_googlemeet.js');

    res.end(`<h2 style="color:green">✅ Success! Refresh token saved.</h2><p>You can close this tab.</p><pre>${refreshToken}</pre>`);
    setTimeout(() => server.close(), 1000);
  } catch (err) {
    res.end(`<h2>Error: ${err.message}</h2>`);
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('STEP 1: First add this redirect URI in Google Cloud Console:');
  console.log('  http://localhost:8080/callback');
  console.log('\nGo to: https://console.cloud.google.com/apis/credentials');
  console.log('Click your OAuth client → Authorized redirect URIs → Add URI');
  console.log('========================================');
  console.log('\nSTEP 2: Then open this URL in Chrome:');
  console.log('========================================');
  console.log(authUrl);
  console.log('\nWaiting for Google to redirect back...');
});
