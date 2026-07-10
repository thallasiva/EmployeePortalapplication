import React, { useState, useEffect } from "react";
import { Search, ShieldCheck, User, Loader2, CheckCircle } from "lucide-react";
import apiClient from "../../api/client";
import { successToast, errorToast } from "../../utils/ToastControllers";

const ROLE_ICONS = {
  1: "🛡️",
  2: "👤",
  3: "📋",
  4: "🎯",
  5: "🔍",
};

const ROLE_COLORS = {
  1: { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  2: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  3: { color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  4: { color: "#f18200", bg: "#fff7ed", border: "#fed7aa" },
  5: { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
};

export default function RoleManagement()
{
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);   // selected employee
  const [pickedRole, setPickedRole] = useState(null); // role_id chosen
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() =>
  {
    Promise.all([
      apiClient.get("/employees/with-roles").then(r => setEmployees(r?.data?.data ?? [])),
      apiClient.get("/employees/roles/list").then(r => setRoles(r?.data?.data ?? [])),
    ]).catch(() => { }).finally(() => setLoading(false));
  }, []);

  function selectEmployee(emp)
  {
    setSelected(emp);
    setPickedRole(emp.role_id ?? null);
  }

  async function handleSave()
  {
    if (!selected || !pickedRole) return;
    if (pickedRole === (selected.role_id ?? null))
    {
      errorToast("No change — same role is already assigned");
      return;
    }
    setSaving(true);
    try
    {
      await apiClient.put(`/employees/${selected.employee_id}/role`, { roleId: pickedRole });
      successToast(`Role updated for ${selected.first_name} ${selected.last_name}`);
      // refresh employee list so role badges update
      const r = await apiClient.get("/employees/with-roles");
      const updated = (r?.data?.data ?? []);
      setEmployees(updated);
      const refreshed = updated.find(e => e.employee_id === selected.employee_id);
      if (refreshed) setSelected(refreshed);
    } catch (err)
    {
      errorToast(err?.response?.data?.message || "Failed to update role");
    } finally
    {
      setSaving(false);
    }
  }

  const filtered = employees.filter(e =>
  {
    const q = search.toLowerCase();
    const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
    return !q || name.includes(q) || (e.emp_code || "").toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q);
  });

  const getRoleLabel = (roleId) => roles.find(r => r.role_id === roleId)?.role_name || "—";
  const getRoleStyle = (roleId) => ROLE_COLORS[roleId] || ROLE_COLORS[2];

  return (
    <div className="px-[28px] py-[24px] max-w-[1100px] mx-auto">

      {/* Page header */}
      <div className="mb-[24px]">

        <div className="flex items-center gap-[10px] mb-[4px]">

          <div className="w-[36px] h-[36px] rounded-[10px] bg-[#fff7ed] flex items-center justify-center">
            <ShieldCheck size={20} color="#f18200" />
          </div>


          <div>

            <h1 className="m-0 text-[20px] font-[700] text-[#111827]">
              Role Management
            </h1>


            <p className="m-0 text-[12px] text-[#6b7280]">
              Select an employee and assign their system role
            </p>

          </div>

        </div>

      </div>

      <div className="grid grid-cols-[1fr_380px] gap-5 items-start">

        {/* ── Left: Employee list ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">

          <div className="p-4 border-b border-gray-100 bg-gray-50">

            <div className="text-[13px] font-bold text-gray-700 mb-2.5">
              Employees{" "}
              <span className="text-xs font-medium text-gray-400">
                ({filtered.length})
              </span>
            </div>

            <div className="relative">

              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID or email…"
                className="
            w-full box-border
            pl-8 pr-3 py-2
            text-[13px]
            border border-gray-200
            rounded-lg
            outline-none
            bg-white
            text-gray-700
            focus:ring-1 focus:ring-orange-400
          "
              />

            </div>

          </div>


          {loading ? (

            <div className="
        flex items-center justify-center
        gap-2.5
        p-12
        text-gray-500
      ">
              <Loader2
                size={18}
                className="animate-spin"
              />
              Loading…
            </div>

          ) : (

            <div className="max-h-[520px] overflow-y-auto">

              {filtered.length === 0 && (
                <div className="
            p-8
            text-center
            text-[13px]
            text-gray-400
          ">
                  No employees found
                </div>
              )}


              {filtered.map(emp =>
              {

                const isActive =
                  selected?.employee_id === emp.employee_id;

                const rc = getRoleStyle(emp.role_id);

                const name =
                  `${emp.first_name || ""} ${emp.last_name || ""}`.trim();

                const initials =
                  (
                    (emp.first_name || "?")[0] +
                    (emp.last_name || "")[0]
                  ).toUpperCase();


                return (

                  <div
                    key={emp.employee_id}
                    onClick={() => selectEmployee(emp)}
                    className={`
                flex items-center gap-3
                px-4 py-3
                cursor-pointer
                border-b border-gray-50
                transition-colors
                ${isActive
                        ? "bg-orange-50 border-l-[3px] border-orange-500"
                        : "bg-white border-l-[3px] border-transparent"
                      }
              `}
                  >


                    {/* Avatar */}
                    <div
                      className={`
                  w-[38px] h-[38px]
                  rounded-full
                  flex items-center justify-center
                  text-[13px]
                  font-bold
                  text-white
                  shrink-0
                  ${isActive
                          ? "bg-orange-500"
                          : "bg-[#1a2535]"
                        }
                `}
                    >
                      {initials}
                    </div>


                    {/* Info */}
                    <div className="flex-1 min-w-0">

                      <div className="
                  text-[13px]
                  font-semibold
                  text-gray-900
                  whitespace-nowrap
                  overflow-hidden
                  text-ellipsis
                ">
                        {name}
                      </div>


                      <div className="
                  text-[11px]
                  text-gray-500
                ">
                        {emp.emp_code} ·{" "}
                        {emp.designation_name ||
                          emp.emp_job_title ||
                          "—"}
                      </div>

                    </div>



                    {/* Current role badge */}
                    <span
                      className="
                  text-[10px]
                  font-bold
                  px-2 py-0.5
                  rounded-full
                  whitespace-nowrap
                  shrink-0
                "
                      style={{
                        backgroundColor: rc.bg,
                        color: rc.color,
                        border: `1px solid ${rc.border}`
                      }}
                    >
                      {ROLE_ICONS[emp.role_id] || ""}
                      {" "}
                      {getRoleLabel(emp.role_id)}
                    </span>


                    {isActive && (
                      <CheckCircle
                        size={14}
                        color="#f18200"
                        className="shrink-0"
                      />
                    )}

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>

      {/* ── Right: Role picker ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">

        <div className="
    px-4 py-3.5
    border-b border-gray-100
    bg-gray-50
  ">
          <div className="
      text-[13px]
      font-bold
      text-gray-700
    ">
            Assign Role
          </div>
        </div>


        {!selected ? (

          <div className="
      p-10
      text-center
    ">
            <User
              size={36}
              color="#d1d5db"
              className="mb-2.5 mx-auto"
            />

            <div className="
        text-[13px]
        text-gray-400
      ">
              Select an employee from the left to assign a role
            </div>
          </div>


        ) : (

          <div className="p-4">

            {/* Selected employee card */}
            <div className="
        flex items-center gap-3
        px-3.5 py-3
        bg-orange-50
        border border-orange-200
        rounded-lg
        mb-5
      ">

              <div className="
          w-[42px]
          h-[42px]
          rounded-full
          bg-orange-500
          text-white
          flex items-center justify-center
          text-[15px]
          font-bold
          shrink-0
        ">
                {(
                  (selected.first_name || "?")[0] +
                  (selected.last_name || "")[0]
                ).toUpperCase()}
              </div>


              <div>

                <div className="
            text-[14px]
            font-bold
            text-gray-900
          ">
                  {selected.first_name} {selected.last_name}
                </div>


                <div className="
            text-[11px]
            text-gray-500
          ">
                  {selected.emp_code} · {selected.email}
                </div>


                <div className="
            text-[11px]
            text-amber-800
            mt-0.5
          ">
                  Current role:{" "}
                  <strong>
                    {getRoleLabel(selected.role_id)}
                  </strong>
                </div>

              </div>

            </div>



            {/* Role title */}
            <div className="
        text-[11px]
        font-bold
        text-gray-500
        uppercase
        tracking-[0.06em]
        mb-2.5
      ">
              Select New Role
            </div>



            {/* Role list */}
            <div className="
        flex flex-col
        gap-2
        mb-5
      ">

              {roles.map(role =>
              {

                const rc = getRoleStyle(role.role_id);
                const isChecked = pickedRole === role.role_id;
                const isCurrent = selected.role_id === role.role_id;


                return (

                  <label
                    key={role.role_id}
                    className="
                flex items-center gap-3
                px-3.5 py-3
                rounded-lg
                cursor-pointer
                transition-all
              "
                    style={{
                      border: isChecked
                        ? `2px solid ${rc.color}`
                        : "1px solid #e5e7eb",

                      background: isChecked
                        ? rc.bg
                        : "#fff",

                      boxShadow: isChecked
                        ? `0 0 0 2px ${rc.color}20`
                        : "none"
                    }}
                  >

                    <input
                      type="radio"
                      name="role"
                      checked={isChecked}
                      onChange={() => setPickedRole(role.role_id)}
                      className="
                  w-4
                  h-4
                  shrink-0
                "
                      style={{
                        accentColor: rc.color
                      }}
                    />


                    <div className="
                text-lg
                shrink-0
              ">
                      {ROLE_ICONS[role.role_id] || "👤"}
                    </div>



                    <div className="flex-1">

                      <div className="
                  flex items-center gap-1.5
                  text-[13px]
                  font-bold
                  text-gray-900
                ">

                        {role.role_name}


                        {isCurrent && (

                          <span className="
                      text-[10px]
                      font-semibold
                      text-emerald-600
                      bg-emerald-100
                      px-2
                      py-[1px]
                      rounded-full
                    ">
                            Current
                          </span>

                        )}

                      </div>


                      <div className="
                  text-[11px]
                  text-gray-500
                ">
                        {role.description || ""}
                      </div>

                    </div>


                  </label>

                );

              })}

            </div>




            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !pickedRole ||
                pickedRole === selected.role_id
              }
              className="
          w-full
          py-[11px]
          text-sm
          font-bold
          text-white
          rounded-lg
          transition-colors
        "
              style={{
                background:
                  saving || pickedRole === selected.role_id
                    ? "#d1d5db"
                    : "#f18200",

                cursor:
                  saving || pickedRole === selected.role_id
                    ? "not-allowed"
                    : "pointer"
              }}
            >
              {
                saving
                  ? "Saving…"
                  : pickedRole === selected.role_id
                    ? "No Change"
                    : `Assign ${getRoleLabel(pickedRole)}`
              }
            </button>


          </div>

        )}

      </div>
    </div>
  );
}
