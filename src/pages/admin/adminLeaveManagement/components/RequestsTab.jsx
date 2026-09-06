import { memo, useCallback, useEffect, useState } from "react";
import { Check, CheckCircle2, Clock, FileText, RefreshCw, X, XCircle } from "lucide-react";
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
  };

  const pending = rows.filter((r) => r.status === "Pending");
  const history = rows.filter((r) => r.status !== "Pending");
  const approved = rows.filter((r) => r.status === "Approved").length;
  const rejected = rows.filter((r) => r.status === "Rejected").length;
  const cards = [
    { label: "Total requests", value: rows.length, icon: FileText, color: "#f18200", bg: "#fff7ed" },
    { label: "Awaiting review", value: pending.length, icon: Clock, color: "#d97706", bg: "#fffbeb" },
    { label: "Approved", value: approved, icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "#dc2626", bg: "#fef2f2" },
  ];

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
      <Toast {...(toast || { msg: null })} />

      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16, padding: "22px 24px", borderRadius: 16,
        background: "linear-gradient(135deg, #172033 0%, #25334b 100%)", boxShadow: "0 8px 24px rgba(15,23,42,.12)" })}>
        <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" })}>
          <div>
            <div className={cssClass({ color: "#fdba74", fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" })}>Leave operations</div>
            <h2 className={cssClass({ margin: "4px 0 0", color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" })}>Requests inbox</h2>
            <p className={cssClass({ margin: "5px 0 0", color: "#cbd5e1", fontSize: 13 })}>Review employee leave requests and keep approvals moving.</p>
          </div>
          <Btn onClick={load} variant="primary" size="sm" className="!border-orange-400 !bg-orange-500 hover:!bg-orange-600">
            <RefreshCw size={13} />Refresh
          </Btn>
        </div>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 })}>
          {cards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 11, background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.08)" })}>
              <span className={cssClass({ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, background: bg, color })}><Icon size={16} /></span>
              <span>
                <span className={cssClass({ display: "block", color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" })}>{label}</span>
                <strong className={cssClass({ display: "block", marginTop: 2, color: "#fff", fontSize: 20, lineHeight: 1 })}>{loading ? "—" : value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13, fontWeight: 600 })}>
          <span className={cssClass({ width: 7, height: 7, borderRadius: "50%", background: "#f18200" })} />
          Filter request history
        </div>
        <select aria-label="Filter leave requests by status" value={status} onChange={(e) => setStatus(e.target.value)} className={cssClass(
          { padding: "9px 34px 9px 12px", borderRadius: 9, border: "1px solid #dbe1ea", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, outline: "none" })}>
          <option value="">All Statuses</option>
          {["Pending", "Approved", "Rejected", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
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
          <div className={cssClass({ border: "1px solid #fde68a", borderRadius: 12, overflowX: "auto", background: "#fff", boxShadow: "0 4px 14px rgba(217,119,6,.06)" })}>
            <table className={cssClass({ width: "100%", minWidth: 900, borderCollapse: "collapse" })}>
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
          <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflowX: "auto", background: "#fff", boxShadow: "0 4px 14px rgba(15,23,42,.04)" })}>
            <table className={cssClass({ width: "100%", minWidth: 780, borderCollapse: "collapse" })}>
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
        <div className={cssClass({ textAlign: "center", padding: "56px 20px", border: "1px dashed #dbe1ea", borderRadius: 14, background: "#fff" })}>
          <div className={cssClass({ width: 44, height: 44, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 13, background: "#fff7ed", color: "#f18200" })}>
            <FileText size={20} />
          </div>
          <div className={cssClass({ color: "#334155", fontSize: 14, fontWeight: 700 })}>No leave requests found</div>
          <div className={cssClass({ marginTop: 4, color: "#94a3b8", fontSize: 12 })}>Try changing the status filter or check back later.</div>
        </div>
      )}


    </div>
  );
});

RequestsTab.displayName = "RequestsTab";
export default RequestsTab;
