'use strict';
/**
 * Zoom Service — Server-to-Server OAuth
 * Creates a Zoom meeting and returns the join URL.
 *
 * Env vars required:
 *   ZOOM_ACCOUNT_ID
 *   ZOOM_CLIENT_ID
 *   ZOOM_CLIENT_SECRET
 *   ZOOM_HOST_EMAIL   (licensed Zoom user who hosts the meeting)
 */

const https = require('https');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        if (res.statusCode === 204 || !data.trim()) {
          if (res.statusCode >= 400) return reject(new Error(`Zoom API error: HTTP ${res.statusCode}`));
          return resolve({});
        }
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const msg = parsed?.message || `HTTP ${res.statusCode}`;
            reject(new Error(`Zoom API error: ${msg}`));
          } else resolve(parsed);
        } catch { reject(new Error(`Failed to parse Zoom response: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Zoom API request timed out after 20 seconds.')));
    if (body) req.write(body);
    req.end();
  });
}

async function getZoomAccessToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error('Zoom credentials not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET in .env');
  }
  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
  const body = `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;

  const data = await request({
    hostname: 'zoom.us',
    path: '/oauth/token',
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  return data.access_token;
}

/**
 * Creates a Zoom meeting.
 * @param {object} opts
 * @param {string} opts.topic
 * @param {string} opts.startDateTime  ISO 8601 e.g. "2026-09-01T10:00:00"
 * @param {number} opts.durationMins
 * @param {string} opts.timeZone       Default "Asia/Kolkata"
 * @param {string} opts.candidateName
 * @returns {{ joinUrl: string, meetingId: string, password: string, startUrl: string }}
 */
async function createZoomMeeting({ topic, startDateTime, durationMins = 60, timeZone = 'Asia/Kolkata', candidateName, candidateEmail }) {
  const accessToken = await getZoomAccessToken();
  const hostEmail = process.env.ZOOM_HOST_EMAIL || '';
  const userPath = hostEmail ? `/users/${encodeURIComponent(hostEmail)}/meetings` : '/users/me/meetings';

  const body = JSON.stringify({
    topic,
    type: 2, // Scheduled meeting
    start_time: startDateTime,
    duration: durationMins,
    timezone: timeZone,
    agenda: `Interview with ${candidateName} — NAT IT HRMS Portal`,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      // Require a per-candidate registration link instead of sharing the
      // meeting join URL. `0` means the registrant is automatically approved.
      approval_type: 0,
      registration_type: 1,
      meeting_authentication: false,
      auto_recording: 'none',
    },
  });

  const result = await request({
    hostname: 'api.zoom.us',
    path: `/v2${userPath}`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  let joinUrl = result.join_url;
  if (candidateEmail) {
    const nameParts = String(candidateName || 'Candidate').trim().split(/\s+/);
    const registration = await request({
      hostname: 'api.zoom.us',
      path: `/v2/meetings/${encodeURIComponent(result.id)}/registrants`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }, JSON.stringify({
      email: candidateEmail,
      first_name: nameParts[0] || 'Candidate',
      last_name: nameParts.slice(1).join(' ') || 'Interviewee',
    }));
    joinUrl = registration.join_url || joinUrl;
  }

  return {
    joinUrl,
    startUrl:  result.start_url,
    meetingId: String(result.id),
    password:  result.password || '',
  };
}

async function cancelZoomMeeting(meetingId) {
  if (!meetingId) return;
  const accessToken = await getZoomAccessToken();
  await request({
    hostname: 'api.zoom.us',
    path: `/v2/meetings/${encodeURIComponent(meetingId)}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

module.exports = { createZoomMeeting, cancelZoomMeeting };
