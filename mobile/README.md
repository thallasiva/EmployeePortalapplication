# NAT IT HRMS Mobile App

Enterprise-grade React Native mobile application for the HRMS system.

## Setup

### 1. Configure API URL
Edit `src/constants/config.js`:
```js
dev: {
  API_URL: 'http://YOUR_MACHINE_IP:5000/api',  // Your backend IP
}
```

### 2. Install Dependencies
```bash
cd mobile
npm install
```

### 3. Run the App
```bash
# Start Expo dev server
npm start

# iOS
npm run ios

# Android
npm run android
```

## Features

### Employee Roles
| Role | Access |
|------|--------|
| Admin | Full access — all modules, all employees |
| HR Manager | Employees, attendance, leave approvals, payroll |
| Team Lead | Team attendance, leave approvals for team |
| Recruiter | Recruitment module |
| Employee | Own attendance, leave, payslips, profile |

### Screens
- **Login** — JWT auth with secure token storage
- **Dashboard** — Role-based stats + quick actions
- **Attendance** — Real-time check in/out with clock, monthly summary
- **Leave** — Apply, view history, approve/reject (for managers)
- **Payroll** — Payslip history with detailed breakdown
- **Employees** — Employee directory with search (admin/HR)
- **Recruitment** — Job listings, candidates pipeline
- **Notifications** — In-app notification center
- **Profile** — Personal info, settings, logout

### Security
- JWT tokens stored in Expo SecureStore (iOS Keychain / Android Keystore)
- Automatic token refresh with queued requests
- Biometric authentication ready

## Architecture
```
src/
├── api/          # Axios API clients (mirrors web app)
├── context/      # AuthContext with role detection
├── navigation/   # Stack + Tab navigators (role-based)
├── screens/      # All app screens
├── components/   # Shared UI components
├── constants/    # Colors, routes, config
└── utils/        # Storage, formatters, validators
```
