import React, { useState } from "react";
import { Save } from "lucide-react";
import { useSettingsState } from "./hooks/useSettingsState";
import { useEmployeeSchedules } from "./hooks/useEmployeeSchedules";
import SettingsHeader from "./components/SettingsHeader";
import CompanyProfile from "./components/CompanyProfile";
import WorkSchedule from "./components/WorkSchedule";
export default function Settings() {
  const {
    selectedCompanyId, selectedCompany,
    companyOpen, setCompanyOpen,
    profile, schedule,
    selectCompany, setProfile, setSchedule, toggleDay,
    save, saving,
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
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          <Save size={15} /> {saving ? "Saving…" : "Save General Settings"}
        </button>
      </div>
      <SettingsHeader
        selectedCompany={selectedCompany}
        selectedCompanyId={selectedCompanyId}
        companyOpen={companyOpen}
        setCompanyOpen={setCompanyOpen}
        selectCompany={selectCompany}
      />
      <div className="grid ">
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
      </div>
    </div>
  );
}
