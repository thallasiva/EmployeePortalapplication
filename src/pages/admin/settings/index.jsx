import React, { useState } from "react";
import { useSettingsState } from "./hooks/useSettingsState";
import { useEmployeeSchedules } from "./hooks/useEmployeeSchedules";
import SettingsHeader from "./components/SettingsHeader";
import CompanyProfile from "./components/CompanyProfile";
import WorkSchedule from "./components/WorkSchedule";
import NotificationPreferences from "./components/NotificationPreferences";

export default function Settings() {
  const {
    selectedCompanyId, selectedCompany,
    companyOpen, setCompanyOpen,
    profile, schedule, notifications,
    selectCompany, setProfile, setSchedule, toggleDay, toggleNotif,
  } = useSettingsState();

  const [scheduleTab, setScheduleTab] = useState("company");

  const empScheduleState = useEmployeeSchedules();

  const empScheduleProps = {
    empSchedules:      empScheduleState.empSchedules,
    schedLoading:      empScheduleState.schedLoading,
    schedSearch:       empScheduleState.schedSearch,
    setSchedSearch:    empScheduleState.setSchedSearch,
    empDropOpen:       empScheduleState.empDropOpen,
    setEmpDropOpen:    empScheduleState.setEmpDropOpen,
    checkedEmps:       empScheduleState.checkedEmps,
    setCheckedEmps:    empScheduleState.setCheckedEmps,
    bulkForm:          empScheduleState.bulkForm,
    setBulkForm:       empScheduleState.setBulkForm,
    bulkSaving:        empScheduleState.bulkSaving,
    filteredEmpScheds: empScheduleState.filteredEmpScheds,
    toggleBulkDay:     empScheduleState.toggleBulkDay,
    toggleCheck:       empScheduleState.toggleCheck,
    toggleAll:         empScheduleState.toggleAll,
    applyBulk:         empScheduleState.applyBulk,
    resetSched:        empScheduleState.resetSched,
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        selectedCompany={selectedCompany}
        selectedCompanyId={selectedCompanyId}
        companyOpen={companyOpen}
        setCompanyOpen={setCompanyOpen}
        selectCompany={selectCompany}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <CompanyProfile
            selectedCompany={selectedCompany}
            profile={profile}
            setProfile={setProfile}
          />
          <WorkSchedule
            selectedCompany={selectedCompany}
            schedule={schedule}
            setSchedule={setSchedule}
            toggleDay={toggleDay}
            scheduleTab={scheduleTab}
            setScheduleTab={setScheduleTab}
            empScheduleProps={empScheduleProps}
            loadEmpSchedules={empScheduleState.loadEmpSchedules}
          />
        </div>

        <NotificationPreferences
          notifications={notifications}
          toggleNotif={toggleNotif}
        />
      </div>
    </div>
  );
}
