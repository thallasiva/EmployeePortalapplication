import React, { useEffect, useState } from "react";
import {
  CheckCircle, XCircle, RefreshCw, Eye, Send,
  Clock, AlertTriangle, User
} from "lucide-react";
import {
  listJoiningInvitations,
  getJoiningDetail,
  reviewJoiningFormality,
  resendJoiningInvitation,
} from "../../api/joining.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import "./adminDashboard.css";

const STATUS_BADGE = {
  pending:              { cls: "pending",  label: "Pending"              },
  submitted:            { cls: "pending",  label: "Submitted"            },
  pending_verification: { cls: "pending",  label: "Pending Verification" },
  approved:             { cls: "approved", label: "Approved"             },
  changes_requested:    { cls: "pending",  label: "Changes Requested"    },
  rejected:             { cls: "rejected", label: "Rejected"             },
};

function fmt(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
    <span className="text-gray-500 w-44 flex-shrink-0">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value || "—"}</span>
  </div>
);

const JoiningVerification = () => {
  const [rows,      setRows]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("pending_verification");
  const [detail,    setDetail]    = useState(null);
  const [detailId,  setDetailId]  = useState(null);
  const [remarks,   setRemarks]   = useState("");
  const [decision,  setDecision]  = useState(null);
  const [reviewing, setReviewing] = useState(false);

  const load = () => {
    setLoading(true);
    listJoiningInvitations({ status: filter === "all" ? undefined : filter, limit: 50 })
      .then((r) => { setRows(r.data ?? []); setTotal(r.meta?.total ?? 0); })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    setRemarks("");
    setDecision(null);
    try { setDetail(await getJoiningDetail(id)); }
    catch (e) { errorToast("Failed to load details"); }
  };

  const submitReview = async () => {
    if (!decision) return;
    setReviewing(true);
    try {
      await reviewJoiningFormality(detailId, { decision, remarks });
      successToast(`Decision: ${decision.replace("_", " ")}`);
      setDetailId(null);
      setDetail(null);
      load();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Review failed");
    } finally { setReviewing(false); }
  };

  const resend = async (id) => {
    try { await resendJoiningInvitation(id); successToast("Invitation email resent"); }
    catch { errorToast("Failed to resend"); }
  };

  const FILTERS = [
    { key: "pending_verification", label: "Pending Review" },
    { key: "changes_requested",    label: "Changes Requested" },
    { key: "approved",             label: "Approved" },
    { key: "rejected",             label: "Rejected" },
    { key: "pending",              label: "Not Yet Submitted" },
    { key: "all",                  label: "All" },
  ];

  return (
    <div className="admin-dash space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Joining Formalities</h1>
          <p className="text-gray-500 mt-1">Verify and approve joining formalities submitted by candidates.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-dash-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No records found.</p>
          ) : (
            <table className="admin-att-table w-full">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = r.invitation_status || r.formality_status || "pending";
                  const badge = STATUS_BADGE[s] || { cls: "pending", label: s };
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(r.candidate_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-800">{r.candidate_name || "—"}</p>
                            <p className="text-xs text-gray-400">{r.candidate_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{r.job_title || "—"}</td>
                      <td><span className={`admin-status-badge ${badge.cls}`}>{badge.label}</span></td>
                      <td className="text-sm text-gray-600">{fmt(r.submitted_at)}</td>
                      <td className="text-sm text-gray-600">{fmt(r.expires_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          {r.formality_id && (
                            <button onClick={() => openDetail(r.id)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg">
                              <Eye size={12} /> Review
                            </button>
                          )}
                          {(s === "pending" || s === "changes_requested") && (
                            <button onClick={() => resend(r.id)} className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg">
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
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <User size={20} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">
                  {detail ? detail.candidate_name : "Loading..."}
                </h2>
              </div>
              <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {!detail ? (
                <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal</p>
                    <InfoRow label="Full Name"       value={detail.full_name} />
                    <InfoRow label="Date of Birth"   value={fmt(detail.dob)} />
                    <InfoRow label="Gender"          value={detail.gender} />
                    <InfoRow label="Blood Group"     value={detail.blood_group} />
                    <InfoRow label="Mobile"          value={detail.mobile} />
                    <InfoRow label="Personal Email"  value={detail.personal_email} />
                    <InfoRow label="Emergency Contact" value={`${detail.emergency_contact_name || "—"} (${detail.emergency_contact_phone || "—"})`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nominees</p>
                    <InfoRow label="Term Life Nominee"  value={`${detail.term_life_nominee_name || "—"} (${detail.term_life_nominee_relation || "—"})`} />
                    <InfoRow label="Gratuity Nominee"   value={`${detail.gratuity_nominee_name || "—"} (${detail.gratuity_nominee_relation || "—"})`} />
                    <InfoRow label="Insurance Nominee"  value={`${detail.insurance_nominee_name || "—"} (${detail.insurance_nominee_relation || "—"})`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">PF</p>
                    <InfoRow label="UAN"          value={detail.uan_number} />
                    <InfoRow label="PF Account"   value={detail.pf_account_number} />
                    <InfoRow label="PF Nominee"   value={`${detail.pf_nominee_name || "—"} (${detail.pf_nominee_relation || "—"})`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bank</p>
                    <InfoRow label="Bank"          value={detail.bank_name} />
                    <InfoRow label="Account No."   value={detail.account_number} />
                    <InfoRow label="IFSC"          value={detail.ifsc_code} />
                    <InfoRow label="Account Holder" value={detail.account_holder_name} />
                  </div>

                  {/* Decision */}
                  {["submitted", "pending_verification", "changes_requested"].includes(detail.formality_status) && (
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">HR Decision</p>
                      <div className="flex gap-2">
                        {[
                          { key: "approve",          label: "Approve",          cls: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100", icon: CheckCircle },
                          { key: "request_changes",  label: "Request Changes",  cls: "text-amber-700 bg-amber-50 hover:bg-amber-100",   icon: AlertTriangle },
                          { key: "reject",           label: "Reject",           cls: "text-rose-700 bg-rose-50 hover:bg-rose-100",       icon: XCircle },
                        ].map(({ key, label, cls, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => setDecision(key)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${cls} ${decision === key ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                          >
                            <Icon size={14} /> {label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder={decision === "request_changes" ? "Specify which fields need correction..." : "Remarks (optional)"}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setDetailId(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Close
              </button>
              {decision && (
                <button
                  onClick={submitReview}
                  disabled={reviewing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {reviewing ? "Submitting..." : "Confirm Decision"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoiningVerification;
