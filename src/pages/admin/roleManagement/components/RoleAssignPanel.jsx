import React from "react";
import { User } from "lucide-react";
import { ROLE_ICONS } from "../constants";

const RoleAssignPanel = React.memo(function RoleAssignPanel({
  selected,
  roles,
  pickedRole,
  onPickRole,
  onSave,
  saving,
  getRoleLabel,
  getRoleStyle
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="text-[13px] font-bold text-gray-700">Assign System Role</div>
        <div className="text-[11px] text-gray-400 mt-0.5">Controls app access &amp; permissions</div>
      </div>

      {!selected ? (
        <div className="p-10 text-center">
          <User size={36} color="#d1d5db" className="mb-2.5 mx-auto" />
          <div className="text-[13px] text-gray-400">Select an employee to assign a role</div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-3 px-3.5 py-3 bg-orange-50 border border-orange-200 rounded-lg mb-5">
            <div className="w-[42px] h-[42px] rounded-full bg-orange-500 text-white flex items-center justify-center text-[15px] font-bold shrink-0">
              {((selected.first_name || "?")[0] + (selected.last_name || "")[0]).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-gray-900">
                {selected.first_name} {selected.last_name}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {selected.emp_code} · {selected.email}
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Designation: <strong>{selected.emp_job_title || selected.designation_name || "Not set"}</strong>
              </div>
              <div className="text-[11px] text-amber-700">
                System role: <strong>{getRoleLabel(selected.role_id)}</strong>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
            Select New Role
          </div>

          <div className="flex flex-col gap-2 mb-5">
            {roles.map((role) => {
              const rc = getRoleStyle(role.role_id);
              const isChecked = pickedRole === role.role_id;
              const isCurrent = selected.role_id === role.role_id;
              return (
                <label
                  key={role.role_id}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    border: isChecked ? `2px solid ${rc.color}` : "1px solid #e5e7eb",
                    background: isChecked ? rc.bg : "#fff",
                    boxShadow: isChecked ? `0 0 0 2px ${rc.color}20` : "none"
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={isChecked}
                    onChange={() => onPickRole(role.role_id)}
                    className="w-4 h-4 shrink-0"
                    style={{ accentColor: rc.color }}
                  />
                  <div className="text-lg shrink-0">{ROLE_ICONS[role.role_id] || "👤"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
                      {role.role_name}
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-[1px] rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">{role.description || ""}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            onClick={onSave}
            disabled={saving || !pickedRole || pickedRole === selected.role_id}
            className="w-full py-[11px] text-sm font-bold text-white rounded-lg transition-colors"
            style={{
              background: saving || pickedRole === selected.role_id ? "#d1d5db" : "#f18200",
              cursor: saving || pickedRole === selected.role_id ? "not-allowed" : "pointer"
            }}
          >
            {saving
              ? "Saving…"
              : pickedRole === selected.role_id
              ? "No Change"
              : `Assign ${getRoleLabel(pickedRole)}`}
          </button>
        </div>
      )}
    </div>
  );
});

export default RoleAssignPanel;
