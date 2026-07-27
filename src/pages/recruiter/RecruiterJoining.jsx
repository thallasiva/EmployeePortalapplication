import Pagination, { usePagination } from "../../components/Pagination";
import React, { useEffect, useState } from "react";
import { Eye, RefreshCw, Clock, FileCheck, XCircle, Send } from "lucide-react";
import {
  listJoiningInvitations, getJoiningDetail,
  resendJoiningInvitation,
} from "../../api/joining.api";
import { errorToast, successToast } from "../../utils/ToastControllers";
import RecruiterTabs from "./RecruiterTabs";
import "../admin/adminDashboard.css";

function fmt(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS = {
  pending:              { cls: "bg-gray-100 text-gray-600",       label: "Not Submitted"     },
  submitted:            { cls: "bg-amber-100 text-amber-700",     label: "Submitted"         },
  pending_verification: { cls: "bg-orange-100 text-orange-700",   label: "Pending Review"    },
  approved:             { cls: "bg-emerald-100 text-emerald-700", label: "Approved"          },
  changes_requested:    { cls: "bg-red-100 text-red-700",         label: "Changes Requested" },
  rejected:             { cls: "bg-red-100 text-red-700",         label: "Rejected"          },
};

const FILTERS = [
  { key: "pending_verification", label: "Pending Review"    },
  { key: "submitted",            label: "Submitted"         },
  { key: "changes_requested",    label: "Changes Requested" },
  { key: "approved",             label: "Approved"          },
  { key: "rejected",             label: "Rejected"          },
  { key: "pending",              label: "Not Submitted"     },
  { key: "all",                  label: "All"               },
];


const Row = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-amber-50 last:border-0 text-[13px]">
    <span className="text-gray-400 w-44 flex-shrink-0 text-[12px]">{label}</span>
    <span className="font-medium text-gray-800 text-right break-all">{value || "—"}</span>
  </div>
);

const Sec = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-amber-100 overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "linear-gradient(to right, #6B5133, #8B7355)" }}>
      <span className="text-[12px] font-bold text-white uppercase tracking-wide">{title}</span>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

export default function RecruiterJoining() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending_verification");
  const [detail,   setDetail]   = useState(null);
  const [detailId, setDetailId] = useState(null);

  const load = () => {
    setLoading(true);
    listJoiningInvitations({ status: filter === "all" ? undefined : filter, limit: 200 })
      .then(r => setRows(r.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    try {
      const d = await getJoiningDetail(id);
      setDetail(d);
    } catch { errorToast("Failed to load details"); }
  };

  const resend = async (id) => {
    try { await resendJoiningInvitation(id); successToast("Invitation resent"); }
    catch { errorToast("Failed to resend"); }
  };

  const parse = (v) => { try { return JSON.parse(v) || []; } catch { return []; } };

  const { paged: pagedRows, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(rows);

  return (
    <div className="p-6 space-y-5">
      <RecruiterTabs />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: "#d97706" }}>
            <FileCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Joining Formalities</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Track joining formality status for your candidates</p>
          </div>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
            style={filter === key
              ? { backgroundColor: "#d97706", color: "#fff", borderColor: "#d97706" }
              : { backgroundColor: "#fbcd97", color: "#92400e", borderColor: "#f59e0b" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#d97706", borderTopColor: "transparent" }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-gray-400">No records found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: "#d97706" }} className="text-white text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Candidate</th>
                  <th className="text-left px-4 py-3 font-semibold">Position</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold">Expires</th>
                  <th className="text-left px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedRows.map(r => {
                  const s = r.invitation_status || r.formality_status || "pending";
                  const badge = STATUS[s] || STATUS.pending;
                  const initials = (r.candidate_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {r.photo_url
                            ? <img src={r.photo_url} alt={r.candidate_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-amber-200" />
                            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: "#fde68a", color: "#92400e" }}>
                                {initials}
                              </div>
                          }
                          <div>
                            <p className="font-medium text-gray-800">{r.candidate_name || "—"}</p>
                            <p className="text-[11px] text-gray-400">{r.candidate_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.job_title || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{fmt(r.submitted_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(r.expires_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {r.formality_id && (
                            <button onClick={() => openDetail(r.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-white"
                              style={{ backgroundColor: "#d97706" }}>
                              <Eye size={12} /> View
                            </button>
                          )}
                          {(s === "pending" || s === "changes_requested") && (
                            <button onClick={() => resend(r.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                              style={{ backgroundColor: "#fbcd97", color: "#92400e" }}>
                              <Send size={12} /> Resend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination */}
            <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
          </div>
        )}
      </div>

      {/* ── View-Only Detail Modal ── */}
      {detailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 flex-shrink-0"
              style={{ background: "linear-gradient(to right, #6B5133, #8B7355)" }}>
              <div className="flex items-center gap-3">
                {detail?.photo_url
                  ? <img src={detail.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover border-2 border-white/40" />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold border-2 border-white/40"
                      style={{ backgroundColor: "#d97706", color: "#fff" }}>
                      {(detail?.candidate_name || "…").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                }
                <div>
                  <p className="font-bold text-white text-[15px]">{detail?.candidate_name || "Loading..."}</p>
                  {detail?.job_title && <p className="text-[11px] text-amber-200">{detail.job_title}</p>}
                </div>
              </div>
              <button onClick={() => { setDetailId(null); setDetail(null); }}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10">
                <XCircle size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {!detail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#d97706", borderTopColor: "transparent" }} />
                </div>
              ) : (
                <>
                  {/* HR-assigned details */}
                  {(detail.admin_employee_id || detail.admin_designation || detail.admin_department) && (
                    <div className="rounded-xl border-2 p-4 mb-4" style={{ borderColor: "#d97706", backgroundColor: "#fef9ee" }}>
                      <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide mb-2">HR Assigned Details</p>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        {detail.admin_employee_id  && <div><span className="text-gray-400 text-[11px]">Employee ID</span><p className="font-semibold text-gray-800">{detail.admin_employee_id}</p></div>}
                        {detail.admin_designation  && <div><span className="text-gray-400 text-[11px]">Designation</span><p className="font-semibold text-gray-800">{detail.admin_designation}</p></div>}
                        {detail.admin_reporting_to && <div><span className="text-gray-400 text-[11px]">Reporting Manager</span><p className="font-semibold text-gray-800">{detail.admin_reporting_to}</p></div>}
                        {detail.admin_department   && <div><span className="text-gray-400 text-[11px]">Department</span><p className="font-semibold text-gray-800">{detail.admin_department}</p></div>}
                      </div>
                    </div>
                  )}

                  {/* Profile Photo */}
                  {detail.photo_url && (
                    <Sec title="Profile Photo">
                      <img src={detail.photo_url} alt="Profile" className="w-28 h-32 object-cover rounded-xl border-2 border-amber-200 shadow" />
                    </Sec>
                  )}

                  <Sec title="Personal Information">
                    <Row label="Full Name"          value={detail.full_name} />
                    <Row label="Date of Birth"      value={fmt(detail.dob)} />
                    <Row label="PAN Number"         value={detail.pan_no} />
                    <Row label="Father Name"        value={detail.father_name} />
                    <Row label="Marital Status"     value={detail.marital_status} />
                    <Row label="Present Address"    value={detail.present_address} />
                    <Row label="Permanent Address"  value={detail.permanent_address} />
                    <Row label="Joining Date"       value={fmt(detail.joining_date_text)} />
                  </Sec>

                  {parse(detail.education_json).length > 0 && (
                    <Sec title="Education">
                      <div className="overflow-x-auto rounded-lg border border-amber-100">
                        <table className="w-full text-[12px]">
                          <thead><tr className="bg-amber-50">{["Qualification","Institute","Specialization","Year"].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-amber-800 uppercase">{h}</th>)}</tr></thead>
                          <tbody>
                            {parse(detail.education_json).map((e, i) => (
                              <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                                <td className="px-3 py-2">{e.qualification || "—"}</td>
                                <td className="px-3 py-2">{e.institute || "—"}</td>
                                <td className="px-3 py-2">{e.specialization || "—"}</td>
                                <td className="px-3 py-2">{e.year || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Sec>
                  )}

                  <Sec title="Bank Details">
                    <Row label="Bank Name"      value={detail.bank_name} />
                    <Row label="Account Holder" value={detail.account_holder_name} />
                    <Row label="Account No."    value={detail.account_number ? "xxxx" + detail.account_number.slice(-4) : "—"} />
                    <Row label="IFSC Code"      value={detail.ifsc_code} />
                    <Row label="Branch"         value={detail.branch_details} />
                  </Sec>

                  {detail.signature_url && (
                    <Sec title="Employee Signature">
                      <img src={detail.signature_url} alt="Signature" className="h-16 object-contain border border-amber-200 rounded-lg bg-white px-3 py-2" />
                    </Sec>
                  )}

                  <div className="text-center py-2">
                    <span className="text-[12px] text-gray-400">View-only — HR review actions are in Admin → Joining Formalities</span>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-amber-100 flex justify-end flex-shrink-0">
              <button onClick={() => { setDetailId(null); setDetail(null); }}
                className="px-4 py-2 text-[13px] font-medium border rounded-lg"
                style={{ color: "#d97706", borderColor: "#d97706", backgroundColor: "#fff" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
