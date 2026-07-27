import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, CheckCircle2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { getEnrollments, enrollEmployees, unenrollEmployee } from "../../../../api/appraisal.api";
import { listEmployees } from "../../../../api/employee.api";
import { BRAND } from "../constants";
import { fmtDate } from "../utils/dateUtils";
import { AppraisalBadge } from "./Badges";
import Modal from "./Modal";

const EnrollmentTab = React.memo(function EnrollmentTab({ cycles }) {
  const [cycleId, setCycleId] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [allEmps, setAllEmps] = useState([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSel, setPickerSel] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!cycles.length) return;
    const active = cycles.find((c) => c.status === "active");
    setCycleId((active || cycles[0]).cycle_id);
  }, [cycles]);

  const fetchEnr = useCallback(async (id) => {
    setLoading(true);
    try { setEnrollments((await getEnrollments(id)) || []); }
    catch { setEnrollments([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (cycleId) fetchEnr(cycleId); }, [cycleId, fetchEnr]);

  const filteredEnr = enrollments.filter((e) =>
    `${e.employee_name} ${e.emp_code || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const openPicker = async () => {
    setShowPicker(true);
    const r = await listEmployees({ status: "Active", limit: 500 }).catch(() => ({ data: [] }));
    const ids = new Set(enrollments.map((e) => e.employee_id));
    setAllEmps((r.data || r || []).filter((e) => !ids.has(e.employee_id)));
  };

  const filteredPicker = allEmps.filter((e) =>
    `${e.first_name} ${e.last_name} ${e.emp_code || ""}`.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handleAdd = async () => {
    if (!pickerSel.length) return;
    setAdding(true);
    try { await enrollEmployees(cycleId, pickerSel); setShowPicker(false); setPickerSel([]); fetchEnr(cycleId); }
    catch {} finally { setAdding(false); }
  };

  const handleRemove = async (empId) => {
    if (!window.confirm("Remove this employee from the cycle?")) return;
    await unenrollEmployee(empId, cycleId);
    fetchEnr(cycleId);
  };

  return (
    <div>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" })}>
        <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#475569" })}>Cycle:</span>
        {cycles.map((c) => (
          <button key={c.cycle_id} onClick={() => setCycleId(c.cycle_id)}
            className={cssClass({ padding: "5px 14px", border: `1.5px solid ${cycleId === c.cycle_id ? BRAND : "#e2e8f0"}`, borderRadius: 999, background: cycleId === c.cycle_id ? "#fff7ed" : "#fff", color: cycleId === c.cycle_id ? BRAND : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 })}>
            {c.fy_label}
            {c.status === "active" && <span className={cssClass({ marginLeft: 5, fontSize: 10, background: "#16a34a", color: "#fff", borderRadius: 999, padding: "1px 5px" })}>Active</span>}
          </button>
        ))}
      </div>

      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 })}>
        <div className={cssClass({ position: "relative", flex: 1, maxWidth: 340 })}>
          <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search enrolled employees…"
            className={cssClass({ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
        </div>
        <button onClick={openPicker}
          className={cssClass({ padding: "9px 16px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 })}>
          <Plus size={13} /> Add Employee
        </button>
      </div>

      {loading
        ? <div className={cssClass({ textAlign: "center", padding: 30, color: "#94a3b8" })}>Loading…</div>
        : (
          <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
              <thead>
                <tr className={cssClass({ background: "#f8fafc" })}>
                  {["Employee", "Designation", "Department", "Manager", "Status", "Enrolled On", ""].map((h) => (
                    <th key={h} className={cssClass({ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" })}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEnr.map((row, i) => (
                  <tr key={i} className={cssClass({ borderBottom: "1px solid #f1f5f9" })}>
                    <td className={cssClass({ padding: "9px 12px", fontWeight: 600, color: "#1e293b" })}>
                      {row.employee_name}
                      <div className={cssClass({ fontSize: 11, color: "#64748b", fontWeight: 400 })}>{row.emp_code}</div>
                    </td>
                    <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.emp_job_title || "—"}</td>
                    <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.department_name || "—"}</td>
                    <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{row.manager_name || "—"}</td>
                    <td className={cssClass({ padding: "9px 12px" })}><AppraisalBadge status={row.appraisal_status || "draft"} /></td>
                    <td className={cssClass({ padding: "9px 12px", color: "#475569" })}>{fmtDate(row.enrolled_at)}</td>
                    <td className={cssClass({ padding: "9px 12px" })}>
                      <button onClick={() => handleRemove(row.employee_id)}
                        className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 })}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnr.length === 0 && (
                  <tr><td colSpan={7} className={cssClass({ padding: 28, textAlign: "center", color: "#94a3b8" })}>No enrollments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      }

      {showPicker && (
        <Modal title="Add Employees to Cycle" onClose={() => setShowPicker(false)} width={480}>
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
            <div className={cssClass({ position: "relative" })}>
              <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
              <input value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} placeholder="Search…"
                className={cssClass({ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" })} />
            </div>
            <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 260, overflowY: "auto" })}>
              {filteredPicker.map((emp) => (
                <label key={emp.employee_id}
                  className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: pickerSel.includes(emp.employee_id) ? "#fff7ed" : "#fff" })}>
                  <input type="checkbox" checked={pickerSel.includes(emp.employee_id)}
                    onChange={() => setPickerSel((p) => p.includes(emp.employee_id) ? p.filter((x) => x !== emp.employee_id) : [...p, emp.employee_id])}
                    className={cssClass({ accentColor: BRAND })} />
                  <div>
                    <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{emp.first_name} {emp.last_name}</div>
                    <div className={cssClass({ fontSize: 11, color: "#64748b" })}>{emp.emp_code} · {emp.emp_job_title || "—"}</div>
                  </div>
                </label>
              ))}
              {filteredPicker.length === 0 && <div className={cssClass({ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>No employees to add.</div>}
            </div>
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10 })}>
              <button onClick={() => setShowPicker(false)}
                className={cssClass({ padding: "8px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 })}>Cancel</button>
              <button onClick={handleAdd} disabled={!pickerSel.length || adding}
                className={cssClass({ padding: "8px 18px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 })}>
                {adding ? "Adding…" : `Add ${pickerSel.length || ""}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
});

export default EnrollmentTab;
