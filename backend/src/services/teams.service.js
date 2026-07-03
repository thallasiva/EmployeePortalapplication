'use strict';

/**
 * Microsoft Teams meeting auto-creation via Microsoft Graph API.
 *
 * Required .env vars:
 *   AZURE_TENANT_ID        — your Azure AD tenant ID
 *   AZURE_CLIENT_ID        — app registration client ID
 *   AZURE_CLIENT_SECRET    — app registration client secret
 *   TEAMS_ORGANIZER_USER_ID — email or object ID of the M365 user who hosts meetings
 *
 * Azure App Registration permissions required (Application, not Delegated):
 *   OnlineMeetings.ReadWrite.All
 *
 * Azure portal: grant admin consent after adding the permission.
 */

const https  = require('https');
const { azure } = require('../config/env');

// ── Low-level HTTPS helper (no axios needed) ──────────────────────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const msg = parsed?.error?.message || parsed?.error_description || `HTTP ${res.statusCode}`;
            reject(new Error(`Graph API error: ${msg}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Get OAuth2 access token (client credentials flow) ────────────────
async function getAccessToken() {
  const { tenantId, clientId, clientSecret } = azure;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure credentials not configured (AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET missing in .env)');
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         'https://graph.microsoft.com/.default',
  }).toString();

  const result = await httpsRequest({
    hostname: 'login.microsoftonline.com',
    path:     `/${tenantId}/oauth2/v2.0/token`,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  return result.access_token;
}

// ── Create Teams online meeting ───────────────────────────────────────
/**
 * @param {{
 *   subject: string,
 *   startDateTime: string,  // ISO 8601 e.g. "2025-08-01T10:00:00"
 *   endDateTime: string,    // ISO 8601
 *   candidateName: string,
 * }} opts
 * @returns {{ joinUrl: string, meetingId: string }}
 */
async function createTeamsMeeting({ subject, startDateTime, endDateTime, candidateName }) {
  const { organizerUserId } = azure;
  if (!organizerUserId) {
    throw new Error('TEAMS_ORGANIZER_USER_ID not set in .env');
  }

  const token = await getAccessToken();

  const payload = JSON.stringify({
    subject:       subject || `Interview — ${candidateName}`,
    startDateTime: startDateTime,
    endDateTime:   endDateTime,
    lobbyBypassSettings: {
      scope:              'organizer',
      isDialInBypassEnabled: false,
    },
  });

  const result = await httpsRequest({
    hostname: 'graph.microsoft.com',
    path:     `/v1.0/users/${encodeURIComponent(organizerUserId)}/onlineMeetings`,
    method:   'POST',
    headers:  {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, payload);

  return {
    joinUrl:   result.joinWebUrl,
    meetingId: result.id,
  };
}

module.exports = { createTeamsMeeting };
