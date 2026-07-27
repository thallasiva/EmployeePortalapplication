import { useState, useCallback } from "react";
import { COMPANIES, DEFAULT_NOTIFICATIONS } from "../constants";

export function useSettingsState() {
  const [selectedCompanyId, setSelectedCompanyId] = useState(COMPANIES[0].id);
  const [companyOpen, setCompanyOpen] = useState(false);

  const [profileByCompany, setProfileByCompany] = useState(() =>
    Object.fromEntries(COMPANIES.map((c) => [c.id, { ...c.profile }]))
  );
  const [scheduleByCompany, setScheduleByCompany] = useState(() =>
    Object.fromEntries(COMPANIES.map((c) => [c.id, { ...c.schedule, workDays: { ...c.schedule.workDays } }]))
  );
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const selectedCompany = COMPANIES.find((c) => c.id === selectedCompanyId) || COMPANIES[0];
  const profile = profileByCompany[selectedCompanyId];
  const schedule = scheduleByCompany[selectedCompanyId];

  const selectCompany = useCallback((id) => {
    setSelectedCompanyId(id);
    setCompanyOpen(false);
  }, []);

  const setProfile = useCallback((field, val) =>
    setProfileByCompany((prev) => ({
      ...prev,
      [selectedCompanyId]: { ...prev[selectedCompanyId], [field]: val },
    })),
  [selectedCompanyId]);

  const setSchedule = useCallback((field, val) =>
    setScheduleByCompany((prev) => ({
      ...prev,
      [selectedCompanyId]: { ...prev[selectedCompanyId], [field]: val },
    })),
  [selectedCompanyId]);

  const toggleDay = useCallback((id) =>
    setScheduleByCompany((prev) => ({
      ...prev,
      [selectedCompanyId]: {
        ...prev[selectedCompanyId],
        workDays: { ...prev[selectedCompanyId].workDays, [id]: !prev[selectedCompanyId].workDays[id] },
      },
    })),
  [selectedCompanyId]);

  const toggleNotif = useCallback((section, channel) =>
    setNotifications((prev) => ({
      ...prev,
      [section]: { ...prev[section], [channel]: !prev[section][channel] },
    })),
  []);

  return {
    selectedCompanyId, selectedCompany,
    companyOpen, setCompanyOpen,
    profile, schedule, notifications,
    selectCompany, setProfile, setSchedule, toggleDay, toggleNotif,
  };
}
