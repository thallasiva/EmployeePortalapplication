'use strict';
/**
 * Google Meet Service
 * Creates a Google Calendar event with a Meet conferencing link.
 *
 * Env vars required:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN   (from OAuth2 playground for the organiser account)
 *   GOOGLE_ORGANIZER_EMAIL (calendar owner whose Meet link is created)
 */

const https = require('https');

function post(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const errDetails = JSON.stringify(parsed?.error?.errors || parsed?.error || parsed);
            const msg = parsed?.error?.message || `HTTP ${res.statusCode}`;
            console.error('[GoogleMeet API Error]', msg, errDetails);
            const error = new Error(`Google API error (${res.statusCode}): ${msg}`);
            error.statusCode = res.statusCode;
            error.details = parsed?.error?.errors || parsed?.error || parsed;
            reject(error);
          } else resolve(parsed);
        } catch { reject(new Error(`Failed to parse Google response: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Google API request timed out after 20 seconds.')));
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google credentials not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env');
  }
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();

  const data = await post({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
  }, body);

  return data.access_token;
}

async function createGoogleMeetMeeting({ summary, startDateTime, endDateTime, candidateName, candidateEmail, timeZone = 'Asia/Kolkata' }) {
  const accessToken = await getAccessToken();
  const requestId = `hrms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!summary || !startDateTime || !endDateTime) {
    throw new Error('Google Meet event requires a summary, start time, and end time.');
  }
  if (Number.isNaN(new Date(startDateTime).getTime()) || Number.isNaN(new Date(endDateTime).getTime())) {
    throw new Error(`Google Meet event has invalid timestamps: ${startDateTime} to ${endDateTime}`);
  }

  const event = {
    summary,
    description: `Interview scheduled via NAT IT HRMS Portal for ${candidateName}`,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    // The OAuth-authorized calendar owner is already the organizer. Adding it
    // as an attendee is unnecessary and can be rejected by some calendars.
    ...(candidateEmail ? { attendees: [{ email: candidateEmail }] } : {}),
    conferenceData: {
      createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } },
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 15 }],
    },
  };

  const body = JSON.stringify(event);
  // Use 'primary' — works for the OAuth-authorized account regardless of email format
  const calId = 'primary';
  const path = `/calendar/v3/calendars/${calId}/events?conferenceDataVersion=1&sendUpdates=none`;

  const result = await post({
    hostname: 'www.googleapis.com',
    path,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  const joinUrl = result?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || result?.hangoutLink || '';
  const htmlLink = result?.htmlLink || '';
  const eventId = result?.id || '';

  if (!joinUrl) throw new Error('Google Meet link was not returned. Check that Google Meet is enabled for this calendar.');
  return { joinUrl, eventId, htmlLink };
}

module.exports = { createGoogleMeetMeeting };
