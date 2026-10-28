import { useState, useCallback, useEffect } from "react";
import { COMPANIES, DEFAULT_NOTIFICATIONS } from "../constants";
import { generalSettingsApi } from "../../../../api/settings.api";
import { apiErrorToast, successToast } from "../../../../utils/ToastControllers";
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
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    generalSettingsApi.get().then((settings) => {
      const companyId = COMPANIES[0].id;
      if (settings.company_profile) {
        setProfileByCompany((prev) => ({ ...prev, [companyId]: { ...prev[companyId], ...settings.company_profile } }));
      }
      if (settings.company_schedule) {
        setScheduleByCompany((prev) => ({
          ...prev,
          [companyId]: {
            ...prev[companyId],
            ...settings.company_schedule,
            workDays: { ...prev[companyId].workDays, ...settings.company_schedule.workDays },
          },
        }));
      }
    }).catch((err) => apiErrorToast(err, "Unable to load general settings."));
  }, []);
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
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await generalSettingsApi.save({
        company_profile: profileByCompany[selectedCompanyId],
        company_schedule: scheduleByCompany[selectedCompanyId],
      });
      successToast("General settings saved.");
    } catch (err) {
      apiErrorToast(err, "Unable to save general settings.");
    } finally {
      setSaving(false);
    }
  }, [profileByCompany, scheduleByCompany, selectedCompanyId]);
  return {
    selectedCompanyId, selectedCompany,
    companyOpen, setCompanyOpen,
    profile, schedule, notifications,
    selectCompany, setProfile, setSchedule, toggleDay, toggleNotif, save, saving,
  };
}
