import { memo, useEffect, useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { listLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from "../../../../api/leaveType.api";
import { cssClass } from "../../../../utils/classStyles";
import { B } from "../constants/leaveConstants";
import Btn from "./Btn";
import Toast from "./Toast";
import LeaveTypeModal from "./LeaveTypeModal";

const LeaveTypesTab = memo(() => {
  const [types, setTypes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    try { const r = await listLeaveTypes(); setTypes(Array.isArray(r) ? r : r.data || []); }
    catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    form.leave_type_id
      ? await updateLeaveType(form.leave_type_id, form)
      : await createLeaveType(form);
    showToast(form.leave_type_id ? "Leave type updated" : "Leave type created");
    setEditing(null);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await deleteLeaveType(id); showToast("Deleted"); load(); }
    catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
      <Toast {...(toast || { msg: null })} />

      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <span className={cssClass({ fontSize: 13, color: "#9ca3af" })}>Configure leave types, quotas and carry-forward rules.</span>
        <Btn onClick={() => setEditing({ leave_type_name: "", short_code: "", annual_quota: 0, carry_forward_limit: 0, requires_proof: false, description: "" })}>
          <Plus size={14} />New Leave Type
        </Btn>
      </div>

      {loading && <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af" })}>Loading…</div>}

      {!loading && (
        <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#fafafa" })}>
                {["Code", "Name", "Annual Quota", "Carry Forward", "Proof", "Description", ""].map((h) => (
                  <th key={h} className={cssClass({ padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: ".06em", textAlign: "left",
                    borderBottom: "1px solid #e9eaec" })}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.leave_type_id}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                  <td className={cssClass({ padding: "11px 14px", fontFamily: "monospace", color: B, fontWeight: 700 })}>
                    {t.short_code || "—"}
                  </td>
                  <td className={cssClass({ padding: "11px 14px", fontWeight: 600, color: "#111827" })}>{t.leave_type_name}</td>
                  <td className={cssClass({ padding: "11px 14px", textAlign: "center" })}>{t.annual_quota}d</td>
                  <td className={cssClass({ padding: "11px 14px", textAlign: "center" })}>{t.carry_forward_limit}d</td>
                  <td className={cssClass({ padding: "11px 14px", textAlign: "center" })}>
                    <span className={cssClass({
                      background: t.requires_proof ? "#eff6ff" : "#f3f4f6",
                      color: t.requires_proof ? "#2563eb" : "#6b7280",
                      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                    })}>
                      {t.requires_proof ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className={cssClass({ padding: "11px 14px", color: "#9ca3af", maxWidth: 200,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                    {t.description || "—"}
                  </td>
                  <td className={cssClass({ padding: "11px 14px" })}>
                    <div className={cssClass({ display: "flex", gap: 6 })}>
                      <Btn size="sm" variant="cancel" onClick={() => setEditing({ ...t })}>
                        <Edit2 size={12} />Edit
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(t.leave_type_id, t.leave_type_name)}>
                        <Trash2 size={12} />Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr>
                  <td colSpan={7} className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>
                    No leave types configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <LeaveTypeModal initial={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
});

LeaveTypesTab.displayName = "LeaveTypesTab";
export default LeaveTypesTab;
