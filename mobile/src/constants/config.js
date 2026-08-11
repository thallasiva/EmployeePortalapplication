import Constants from 'expo-constants';

// ─── Server URLs ──────────────────────────────────────────────────────────────
// PROD_URL  : your deployed server (always used for production builds)
// LOCAL_URL : your dev machine LAN IP (local simulator/device only)
//
// Set SERVER_ENV = 'prod' to force Expo Go to hit the live server during testing
// Set SERVER_ENV = 'local' to use the LAN IP for local dev
const PROD_URL  = 'https://api.natit.in/api';
const LOCAL_URL = 'http://192.168.10.32:5000/api';

const SERVER_ENV = 'prod'; // ← change to 'local' when testing with local server

const ENV = {
  dev: {
    API_URL: SERVER_ENV === 'prod' ? PROD_URL : LOCAL_URL,
  },
  prod: {
    API_URL: PROD_URL,
  },
};

const getEnvVars = () => {
  if (__DEV__) return ENV.dev;
  return ENV.prod;
};

export default getEnvVars();

export const ROLES = {
  ADMIN: 1,
  HR_MANAGER: 2,
  TL: 3,
  LEAD: 4,
  RECRUITER: 5,
  EMPLOYEE: 6,
};

export const ROLE_LABELS = {
  1: 'Administrator',
  2: 'HR Manager',
  3: 'Team Lead',
  4: 'Lead',
  5: 'Recruiter',
  6: 'Employee',
};

export const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave'];

export const PAGINATION = { DEFAULT_LIMIT: 20 };
