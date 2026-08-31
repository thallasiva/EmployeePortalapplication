'use strict';
require('dotenv').config();
const { createGoogleMeetMeeting } = require('./src/services/googleMeet.service');

async function test() {
  console.log('Testing Google Meet API...');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('Refresh Token:', process.env.GOOGLE_REFRESH_TOKEN ? 'SET (' + process.env.GOOGLE_REFRESH_TOKEN.slice(0,10) + '...)' : 'MISSING');
  console.log('Organizer Email:', process.env.GOOGLE_ORGANIZER_EMAIL || 'MISSING');
  console.log('---');
// Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_ORGANIZER_EMAIL,
// and GOOGLE_REFRESH_TOKEN in backend/.env. Never put real credentials here.


  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const end   = new Date(start.getTime() + 60 * 60 * 1000);   // 1 hour duration

  const toISO = d => d.toISOString().replace(/\.\d{3}Z$/, '');

  try {
    const result = await createGoogleMeetMeeting({
      summary: 'Test Interview — Google Meet',
      startDateTime: toISO(start),
      endDateTime: toISO(end),
      candidateName: 'Test Candidate',
      candidateEmail: process.env.GOOGLE_ORGANIZER_EMAIL || '',
    });
    console.log('SUCCESS!');
    console.log('Join URL:', result.joinUrl);
    console.log('Event ID:', result.eventId);
    console.log('HTML Link:', result.htmlLink);
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

test();
