import React from "react";
import { useRoleManagement } from "./hooks/useRoleManagement";
import PageHeader from "./components/PageHeader";
import EmployeeList from "./components/EmployeeList";
import RoleAssignPanel from "./components/RoleAssignPanel";
import JobRolesPanel from "./components/JobRolesPanel";

export default function RoleManagement() {
  const {
    roles,
    search,
    setSearch,
    selected,
    pickedRole,
    setPickedRole,
    loading,
    saving,
    filtered,
    selectEmployee,
    handleDesignationSaved,
    handleSave,
    loadEmployees,
    getRoleLabel,
    getRoleStyle
  } = useRoleManagement();

  return (
    <div className="px-7 py-6" style={{ maxWidth: 1400, margin: "0 auto" }}>
      <PageHeader />

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 340px 280px" }}>
        <EmployeeList
          filtered={filtered}
          loading={loading}
          selected={selected}
          search={search}
          onSearch={setSearch}
          onSelect={selectEmployee}
          getRoleLabel={getRoleLabel}
          getRoleStyle={getRoleStyle}
        />

        <RoleAssignPanel
          selected={selected}
          roles={roles}
          pickedRole={pickedRole}
          onPickRole={setPickedRole}
          onSave={handleSave}
          saving={saving}
          getRoleLabel={getRoleLabel}
          getRoleStyle={getRoleStyle}
        />

        <JobRolesPanel
          selected={selected}
          onDesignationSaved={handleDesignationSaved}
          onEmployeesRefresh={loadEmployees}
        />
      </div>
    </div>
  );
}
