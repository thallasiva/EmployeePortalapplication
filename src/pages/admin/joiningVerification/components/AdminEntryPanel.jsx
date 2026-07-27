import React from "react";
import { AdminCombo, AdminSelect } from "./SharedUI";
import { DESIGNATION_LIST, DEPARTMENT_LIST } from "../constants";

const AdminEntryPanel = React.memo(function AdminEntryPanel({
  detail,
  adminFields,
  managers,
  reviewing,
  onUpdateAdminField,
  onSave,
}) {
  const show = ["submitted", "pending_verification", "changes_requested", "approved"].includes(
    detail.formality_status
  );
  if (!show) return null;

  const hasSaved =
    detail.admin_employee_id ||
    detail.admin_designation ||
    detail.admin_reporting_to ||
    detail.admin_department;

  return (
    <div
      className="rounded-xl border-2 p-4 mb-4"
      style={{ borderColor: "#d97706", backgroundColor: "#fef9ee" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: "#d97706" }}
        >
          HR
        </div>
        <span className="text-[12px] font-bold text-amber-900 uppercase tracking-wide">
          Admin Entry — Visible to HR Only
        </span>
      </div>

      {hasSaved && (
        <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-white">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">
            Currently Saved
          </p>
          <div className="grid grid-cols-2 gap-2">
            {detail.admin_employee_id && (
              <div>
                <p className="text-[10px] text-gray-400">Employee ID</p>
                <p className="text-[13px] font-semibold text-gray-800">{detail.admin_employee_id}</p>
              </div>
            )}
            {detail.admin_designation && (
              <div>
                <p className="text-[10px] text-gray-400">Designation</p>
                <p className="text-[13px] font-semibold text-gray-800">{detail.admin_designation}</p>
              </div>
            )}
            {detail.admin_reporting_to && (
              <div>
                <p className="text-[10px] text-gray-400">Reporting Manager</p>
                <p className="text-[13px] font-semibold text-gray-800">{detail.admin_reporting_to}</p>
              </div>
            )}
            {detail.admin_department && (
              <div>
                <p className="text-[10px] text-gray-400">Department</p>
                <p className="text-[13px] font-semibold text-gray-800">{detail.admin_department}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="mb-2">
          <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">
            Employee ID
          </label>
          <input
            name="employeeId"
            value={adminFields.employeeId || ""}
            onChange={onUpdateAdminField}
            placeholder="e.g. EMP001"
            className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white"
          />
        </div>
        <AdminCombo
          label="Designation"
          name="designation"
          value={adminFields.designation}
          onChange={onUpdateAdminField}
          options={DESIGNATION_LIST}
          listId="desig-list"
          placeholder="Select or type designation..."
        />
        <AdminSelect
          label="Reporting Manager"
          name="reportingTo"
          value={adminFields.reportingTo}
          onChange={onUpdateAdminField}
          options={managers}
          placeholder="Select manager..."
        />
        <AdminCombo
          label="Department"
          name="department"
          value={adminFields.department}
          onChange={onUpdateAdminField}
          options={DEPARTMENT_LIST}
          listId="dept-list"
          placeholder="Select or type department..."
        />
      </div>
      {detail.formality_status === "approved" && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onSave}
            disabled={reviewing}
            className="px-4 py-1.5 text-[12px] font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ backgroundColor: "#d97706" }}
          >
            {reviewing ? "Saving…" : "Save Details"}
          </button>
        </div>
      )}
    </div>
  );
});

export default AdminEntryPanel;
