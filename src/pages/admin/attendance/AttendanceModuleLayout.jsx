import React from 'react';
import { Outlet } from 'react-router-dom';

// Attendance navigation is provided by the application's existing sidebar.
// The selected nested route renders here in the shared main content area.
export default function AttendanceModuleLayout() {
  return <div className="min-h-full"><Outlet /></div>;
}
