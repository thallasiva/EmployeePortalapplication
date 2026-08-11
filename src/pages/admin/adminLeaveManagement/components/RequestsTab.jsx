import { memo, useCallback, useEffect, useState } from "react";
import { Check, Clock, RefreshCw, X } from "lucide-react";
import { listLeaveRequests, reviewLeaveRequest } from "../../../../api/leaveRequest.api";
import { cssClass } from "../../../../utils/classStyles";
import Btn from "./Btn";
import StatusBadge from "./StatusBadge";
import Toast from "./Toast";

const TH = ({ children, right }) => (
  <th className={cssClass({ padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: ".06em", textAlign: right ? "right" : "left",
    borderBottom: "1px solid #e9eaec", whiteSpace: "nowrap", background: "#fafafa" })}>
    {children}
  </th>
);

const TD = ({ children, right }) => (
  <td className={cssClass({ padding: "11px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f5f5f5",
    textAlign: right ? "right" : "left", verticalAlign: "middle" })}>
    {children}
  </td>
);

const RequestsTab = memo(() => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("");
  const [toast, setToast]     = useState(null);


  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await listLeaveRequests({ status: status || undefined, limit: 500 })).data || []); }
    catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (id, decision, remarks = "") => {
    try {
      await reviewLeaveRequest(id, { decision, remarks });
      showToast(`Request ${decision}`);
      load();
    } catch (e) { showToast(e.message, "error"); }
    setReviewing(null);
  };

  const pending = rows.filter((r) => r.status === "Pending");
  const history = rows.filter((r) => r.status !== "Pending");

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
      <Toast {...(toast || { msg: null })} />

      <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" })}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={cssClass(
          { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 })}>
          <option value="">All Statuses</option>
          {["Pending", "Approved", "Rejected", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <Btn onClick={load} variant="cancel" size="sm"><RefreshCw size={13} />Refresh</Btn>
      </div>

      {loading && <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af" })}>Loading…</div>}

      {!loading && pending.length > 0 && (
        <div>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 })}>
            <Clock size={15} color="#d97706" />
            <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#92400e" })}>
              Pending Approval ({pending.length})
            </span>
          </div>
          <div className={cssClass({ border: "1px solid #fde68a", borderRadius: 12, overflow: "hidden", background: "#fff" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
              <thead><tr>
                <TH>Employee</TH><TH>Leave Type</TH><TH>From</TH><TH>To</TH>
                <TH right>Days</TH><TH>Reason</TH><TH>Actions</TH>
              </tr></thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.leave_request_id}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fffbeb"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    className={cssClass({ background: "#fff" })}>
                    <TD>
                      <div className={cssClass({ fontWeight: 700, color: "#111827" })}>{r.employee_name}</div>
                      <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{r.emp_code} · {r.department_name}</div>
                    </TD>
                    <TD>{r.leave_type_name}</TD>
                    <TD>{r.from_date?.slice(0, 10)}</TD>
                    <TD>{r.to_date?.slice(0, 10)}</TD>
                    <TD right><strong>{r.days}</strong></TD>
                    <TD>
                      <span className={cssClass({ color: "#6b7280", maxWidth: 160, display: "block",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                        {r.reason || "—"}
                      </span>
                    </TD>
                    <TD>
                      <div className={cssClass({ display: "flex", gap: 6 })}>
                        <Btn size="sm" onClick={() => handleReview(r.leave_request_id, "Approved")}>
                          <Check size={12} />Approve
                        </Btn>
                        <Btn size="sm" variant="danger"
                          onClick={async () => {
                            const remarks = window.prompt("Reason for rejection (optional):") ?? "";
                            await handleReview(r.leave_request_id, "Rejected", remarks);
                          }}>
                          <X size={12} />Reject
                        </Btn>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div>
          <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10 })}>
            History ({history.length})
          </div>
          <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflow: "hidden", background: "#fff" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
              <thead><tr>
                <TH>Employee</TH><TH>Leave Type</TH><TH>From</TH><TH>To</TH>
                <TH right>Days</TH><TH>Status</TH><TH>Reviewed By</TH>
              </tr></thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.leave_request_id}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <TD>
                      <div className={cssClass({ fontWeight: 600, color: "#111827" })}>{r.employee_name}</div>
                      <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{r.emp_code}</div>
                    </TD>
                    <TD>{r.leave_type_name}</TD>
                    <TD>{r.from_date?.slice(0, 10)}</TD>
                    <TD>{r.to_date?.slice(0, 10)}</TD>
                    <TD right>{r.days}</TD>
                    <TD><StatusBadge status={r.status} /></TD>
                    <TD>{r.reviewer_name || "—"}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>No leave requests found.</div>
      )}


    </div>
  );
});

RequestsTab.displayName = "RequestsTab";
export default RequestsTab;
