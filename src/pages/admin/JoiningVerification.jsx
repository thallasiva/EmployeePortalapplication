import Pagination, { usePagination } from "../../components/Pagination";
import React, { useEffect, useState } from "react";
import {
  CheckCircle, XCircle, RefreshCw, Eye, Send, AlertTriangle,
  Clock, FileCheck, User, Landmark, Shield, Heart, ClipboardList, PenLine,
  FileText, ExternalLink,
} from "lucide-react";
import {
  listJoiningInvitations, getJoiningDetail,
  reviewJoiningFormality, resendJoiningInvitation,
} from "../../api/joining.api";
import { listEmployees } from "../../api/employee.api";
import { successToast, errorToast } from "../../utils/ToastControllers";

const DESIGNATION_LIST = [
  "Intern","Trainee","Associate Software Engineer","Software Engineer","Senior Software Engineer",
  "Lead Software Engineer","Technical Lead","Team Lead","Module Lead","Project Lead",
  "Engineering Manager","Delivery Manager","Project Manager","Program Manager","Product Manager",
  "Product Owner","Scrum Master","Solution Architect","Technical Architect","Enterprise Architect",
  "UI Developer","Frontend Developer","Backend Developer","Full Stack Developer","Mobile App Developer",
  "Android Developer","iOS Developer","DevOps Engineer","Site Reliability Engineer (SRE)",
  "Cloud Engineer","Data Engineer","Data Analyst","Data Scientist","AI/ML Engineer",
  "QA Engineer","Automation Test Engineer","Manual Test Engineer","Performance Test Engineer",
  "Security Engineer","Database Administrator (DBA)","System Administrator","Network Administrator",
  "Business Analyst","HR Executive","HR Manager","Talent Acquisition Executive","Recruiter",
  "Payroll Executive","Finance Executive","Accountant","Accounts Manager","Admin Executive",
  "Office Manager","Customer Support Executive","Customer Success Manager","Sales Executive",
  "Business Development Executive","Sales Manager","Marketing Executive","Digital Marketing Specialist",
  "Graphic Designer","Content Writer","Operations Executive","Operations Manager",
  "CEO","CTO","COO","CFO","Director","Vice President (VP)",
].map(d => ({ value: d, label: d }));

const DEPARTMENT_LIST = [
  "Engineering","Information Technology (IT)","Software Development","Product Development",
  "Product Management","Quality Assurance (QA)","Testing","DevOps","Cloud Operations",
  "Infrastructure","Technical Support","Customer Support","Customer Success",
  "Human Resources (HR)","Talent Acquisition","Payroll","Finance","Accounts","Administration",
  "Sales","Business Development","Marketing","Digital Marketing","Operations","Procurement",
  "Legal","Compliance","Security","Data Analytics","Artificial Intelligence (AI)",
  "Research & Development (R&D)","Project Management Office (PMO)","Training & Development",
  "Facilities Management","Corporate Communications","Executive Management",
].map(d => ({ value: d, label: d }));

function fmt(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

const STATUS = {
  pending:              { cls: "bg-gray-100 text-gray-600",     label: "Not Submitted"     },
  submitted:            { cls: "bg-amber-100 text-amber-700",   label: "Submitted"         },
  pending_verification: { cls: "bg-orange-100 text-orange-700", label: "Pending Review"    },
  approved:             { cls: "bg-emerald-100 text-emerald-700", label: "Approved"        },
  changes_requested:    { cls: "bg-red-100 text-red-700",       label: "Changes Requested" },
  rejected:             { cls: "bg-red-100 text-red-700",       label: "Rejected"          },
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

/* ── Small reusable pieces ── */
const Row = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-amber-50 last:border-0 text-[13px]">
    <span className="text-gray-400 w-44 flex-shrink-0 text-[12px]">{label}</span>
    <span className="font-medium text-gray-800 text-right break-all">{value || "—"}</span>
  </div>
);

const Sec = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl border border-amber-100 overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6B5133] to-[#8B7355]">
      <Icon size={13} className="text-white/80" />
      <span className="text-[12px] font-bold text-white uppercase tracking-wide">{title}</span>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

/* Combobox: pick from list OR type a custom value */
const AdminCombo = ({ label, name, value, onChange, options, listId, placeholder }) => (
  <div className="mb-2">
    <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">{label}</label>
    <input name={name} value={value||""} onChange={onChange} placeholder={placeholder}
      list={listId} autoComplete="off"
      className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white" />
    <datalist id={listId}>
      {options.map(o => <option key={o.value} value={o.value} />)}
    </datalist>
  </div>
);

/* Dropdown-only for Reporting Manager */
const AdminSelect = ({ label, name, value, onChange, options, placeholder }) => (
  <div className="mb-2">
    <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">{label}</label>
    <select name={name} value={value||""} onChange={onChange}
      className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white font-sans">
      <option value="">{placeholder || `Select ${label}...`}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TblHead = ({ cols }) => (
  <thead>
    <tr className="bg-amber-50">
      {cols.map(c => <th key={c} className="px-3 py-2 text-left text-[10px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-100">{c}</th>)}
    </tr>
  </thead>
);

export default function JoiningVerification() {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("pending_verification");
  const { paged: pagedRows, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(rows);
  const [detail,    setDetail]    = useState(null);
  const [detailId,  setDetailId]  = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [remarks,   setRemarks]   = useState("");
  const [decision,  setDecision]  = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [adminFields, setAdminFields] = useState({ employeeId:"", designation:"", reportingTo:"", department:"" });

  // Reporting Manager dropdown (live from DB; role_id=3)
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 })
      .then(res => {
        const all  = res.data ?? [];
        const mgrs = all.filter(e => Number(e.role_id) === 3);
        const src  = mgrs.length > 0 ? mgrs : all;
        setManagers(src.map(e => ({
          value: `${e.first_name}${e.last_name ? ' ' + e.last_name : ''}`,
          label: `${e.first_name}${e.last_name ? ' ' + e.last_name : ''} (${e.emp_code || ''})`,
        })));
      })
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    listJoiningInvitations({ status: filter === "all" ? undefined : filter, limit: 100 })
      .then(r => setRows(r.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openDetail = async (id, row) => {
    setDetailId(id);
    setDetail(null);
    setSelectedRow(row || null);
    setRemarks("");
    setDecision(null);
    setAdminFields({ employeeId:"", designation:"", reportingTo:"", department:"" });
    try {
      const d = await getJoiningDetail(id);
      setDetail(d);
      // Pre-populate if already saved
      setAdminFields({
        employeeId:  d.admin_employee_id  || "",
        designation: d.admin_designation  || "",
        reportingTo: d.admin_reporting_to || "",
        department:  d.admin_department   || "",
      });
    }
    catch { errorToast("Failed to load details"); }
  };

  const submitReview = async () => {
    if (!decision) return;
    setReviewing(true);
    try {
      await reviewJoiningFormality(detailId, { decision, remarks, ...adminFields });
      successToast("Decision submitted");
      setDetailId(null); setDetail(null); setSelectedRow(null); load();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Review failed");
    } finally { setReviewing(false); }
  };

  /* Save admin fields only (no decision change) — for approved/rejected records */
  const saveAdminFieldsOnly = async () => {
    setReviewing(true);
    try {
      const updated = await reviewJoiningFormality(detailId, {
        decision: detail.formality_status === "rejected" ? "reject" : "approve",
        remarks:  detail.hr_remarks || "",
        ...adminFields,
      });
      setDetail(prev => ({ ...prev, ...updated,
        admin_employee_id:  adminFields.employeeId  || prev.admin_employee_id,
        admin_designation:  adminFields.designation || prev.admin_designation,
        admin_reporting_to: adminFields.reportingTo || prev.admin_reporting_to,
        admin_department:   adminFields.department  || prev.admin_department,
      }));
      successToast("Employee details saved");
      load();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Save failed");
    } finally { setReviewing(false); }
  };

  const resend = async (id) => {
    try { await resendJoiningInvitation(id); successToast("Invitation resent"); }
    catch { errorToast("Failed to resend"); }
  };

  const af = (e) => setAdminFields(p => ({ ...p, [e.target.name]: e.target.value }));

  /* parse JSON arrays safely */
  const parse = (v) => { try { return JSON.parse(v) || []; } catch { return []; } };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{backgroundColor:"#d97706"}}>
            <FileCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Joining Formalities</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Review and approve joining formalities submitted by new employees</p>
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
              ? { backgroundColor:"#d97706", color:"#fff", borderColor:"#d97706" }
              : { backgroundColor:"#fbcd97", color:"#92400e", borderColor:"#f59e0b" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:"#d97706", borderTopColor:"transparent"}} />
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
                <tr style={{backgroundColor:"#d97706"}} className="text-white text-[11px] uppercase tracking-wider">
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
                  const initials = (r.candidate_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                  return (
                    <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{backgroundColor:"#fde68a", color:"#92400e"}}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{r.candidate_name||"—"}</p>
                            <p className="text-[11px] text-gray-400">{r.candidate_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.job_title||"—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{fmt(r.submitted_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(r.expires_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {r.formality_id && (
                            <button onClick={() => openDetail(r.id, r)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors text-white"
                              style={{backgroundColor:"#d97706"}}>
                              <Eye size={12} /> Review
                            </button>
                          )}
                          {(s==="pending"||s==="changes_requested") && (
                            <button onClick={() => resend(r.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                              style={{backgroundColor:"#fbcd97", color:"#92400e"}}>
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

      {/* ── Detail Modal ── */}
      {detailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 flex-shrink-0"
              style={{background:"linear-gradient(to right, #6B5133, #8B7355)"}}>
              <div className="flex items-center gap-3">
                {detail?.photo_url
                  ? <img src={detail.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover border-2 border-white/40" />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold border-2 border-white/40" style={{backgroundColor:"#d97706", color:"#fff"}}>
                      {((detail?.candidate_name || selectedRow?.candidate_name) || "…").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                }
                <div>
                  <p className="font-bold text-white text-[15px]">{detail?.candidate_name || selectedRow?.candidate_name || "Loading..."}</p>
                  {(detail?.job_title || selectedRow?.job_title) && <p className="text-[11px] text-amber-200">{detail?.job_title || selectedRow?.job_title}</p>}
                </div>
              </div>
              <button onClick={() => setDetailId(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10">
                <XCircle size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {!detail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:"#d97706",borderTopColor:"transparent"}} />
                </div>
              ) : (
                <>
                  {/* ── Profile Photo ── */}
                  {detail.photo_url && (
                    <Sec icon={User} title="Profile Photo">
                      <img src={detail.photo_url} alt="Profile" className="w-28 h-32 object-cover rounded-xl border-2 border-amber-200 shadow" />
                    </Sec>
                  )}

                  {/* ── Personal Information ── */}
                  <Sec icon={User} title="Personal Information">
                    <Row label="Full Name"          value={detail.full_name} />
                    <Row label="Date of Birth"      value={fmt(detail.dob)} />
                    <Row label="Actual DOB"         value={fmt(detail.actual_dob)} />
                    <Row label="PAN Number"         value={detail.pan_no} />
                    <Row label="Father Name"        value={detail.father_name} />
                    <Row label="Marital Status"     value={detail.marital_status} />
                    <Row label="Spouse Name"        value={detail.spouse_name} />
                    <Row label="Present Address"    value={detail.present_address} />
                    <Row label="Permanent Address"  value={detail.permanent_address} />
                    <Row label="Joining Date"       value={fmt(detail.joining_date_text)} />
                    <Row label="Designation (letter)" value={detail.designation_text} />
                  </Sec>

                  {/* ── Education ── */}
                  {parse(detail.education_json).length > 0 && (
                    <Sec icon={FileCheck} title="Education Details">
                      <div className="overflow-x-auto rounded-lg border border-amber-100">
                        <table className="w-full text-[12px]">
                          <TblHead cols={["Qualification","Institute","Specialization","Year"]} />
                          <tbody>
                            {parse(detail.education_json).map((e,i) => (
                              <tr key={i} className={"border-b border-amber-50 " + (i%2===0?"bg-white":"bg-amber-50/30")}>
                                <td className="px-3 py-2">{e.qualification||"—"}</td>
                                <td className="px-3 py-2">{e.institute||"—"}</td>
                                <td className="px-3 py-2">{e.specialization||"—"}</td>
                                <td className="px-3 py-2">{e.year||"—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Sec>
                  )}

                  {/* ── References ── */}
                  {parse(detail.references_json).length > 0 && (
                    <Sec icon={User} title="References">
                      <div className="overflow-x-auto rounded-lg border border-amber-100">
                        <table className="w-full text-[12px]">
                          <TblHead cols={["Name","Occupation","Relationship","Contact"]} />
                          <tbody>
                            {parse(detail.references_json).map((r,i) => (
                              <tr key={i} className={"border-b border-amber-50 " + (i%2===0?"bg-white":"bg-amber-50/30")}>
                                <td className="px-3 py-2">{r.name||"—"}</td>
                                <td className="px-3 py-2">{r.occupation||"—"}</td>
                                <td className="px-3 py-2">{r.relationship||"—"}</td>
                                <td className="px-3 py-2">{r.contact||"—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Sec>
                  )}

                  {/* ── Term Life Insurance Nominees ── */}
                  <Sec icon={Heart} title="Term Life Insurance Nominees">
                    {parse(detail.term_life_nominees_json).length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-amber-100">
                        <table className="w-full text-[12px]">
                          <TblHead cols={["Name & Address","Relationship","DOB","Share %","Guardian"]} />
                          <tbody>
                            {parse(detail.term_life_nominees_json).map((n,i) => (
                              <tr key={i} className={"border-b border-amber-50 " + (i%2===0?"bg-white":"bg-amber-50/30")}>
                                <td className="px-3 py-2">{n.nomineeNameAndAddress||"—"}</td>
                                <td className="px-3 py-2">{n.relationship||"—"}</td>
                                <td className="px-3 py-2">{fmt(n.dateOfBirth)}</td>
                                <td className="px-3 py-2">{n.shareAmount||"—"}%</td>
                                <td className="px-3 py-2">{n.guardianDetails||"—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className="text-[12px] text-gray-400">No nominees added.</p>}
                  </Sec>

                  {/* ── Gratuity Nominees ── */}
                  <Sec icon={Shield} title="Gratuity Nominees (Form F)">
                    <Row label="Employee Name"       value={detail.gratuity_employee_intro_name} />
                    <Row label="Religion"            value={detail.gratuity_religion} />
                    <Row label="Marital Status"      value={detail.gratuity_marital_status} />
                    <Row label="Dept/Branch/Section" value={detail.gratuity_department_branch_section} />
                    <Row label="Date of Joining"     value={fmt(detail.gratuity_date_of_joining)} />
                    {parse(detail.gratuity_nominees_json).length > 0 && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-amber-100">
                        <table className="w-full text-[12px]">
                          <TblHead cols={["S.No","Full Name & Address","Relationship","Age","Share %"]} />
                          <tbody>
                            {parse(detail.gratuity_nominees_json).map((n,i) => (
                              <tr key={i} className={"border-b border-amber-50 " + (i%2===0?"bg-white":"bg-amber-50/30")}>
                                <td className="px-3 py-2 font-bold text-amber-700">{i+1}</td>
                                <td className="px-3 py-2">{n.fullNameAndAddress||"—"}</td>
                                <td className="px-3 py-2">{n.relationship||"—"}</td>
                                <td className="px-3 py-2">{n.age||"—"}</td>
                                <td className="px-3 py-2">{n.sharePercentage||"—"}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Sec>

                  {/* ── Insurance Nominees ── */}
                  <Sec icon={ClipboardList} title="Group Personal Accidental Insurance Nominees">
                    {parse(detail.ins_nominees_json).length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-amber-100">
                        <table className="w-full text-[12px]">
                          <TblHead cols={["Name & Address","Relationship","DOB","Share %","Guardian"]} />
                          <tbody>
                            {parse(detail.ins_nominees_json).map((n,i) => (
                              <tr key={i} className={"border-b border-amber-50 " + (i%2===0?"bg-white":"bg-amber-50/30")}>
                                <td className="px-3 py-2">{n.nomineeNameAndAddress||"—"}</td>
                                <td className="px-3 py-2">{n.relationship||"—"}</td>
                                <td className="px-3 py-2">{fmt(n.dateOfBirth)}</td>
                                <td className="px-3 py-2">{n.shareAmount||"—"}%</td>
                                <td className="px-3 py-2">{n.guardianDetails||"—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className="text-[12px] text-gray-400">No nominees added.</p>}
                  </Sec>

                  {/* ── PF Declaration ── */}
                  <Sec icon={Shield} title="PF Declaration (Form 11)">
                    <Row label="Employee Name"         value={detail.pf_employee_name} />
                    <Row label="Date of Birth"         value={fmt(detail.pf_date_of_birth)} />
                    <Row label="Father/Spouse Name"    value={detail.pf_father_or_spouse_name} />
                    <Row label="Relation"              value={detail.pf_relation_type} />
                    <Row label="Gender"                value={detail.pf_gender} />
                    <Row label="Marital Status"        value={detail.pf_marital_status} />
                    <Row label="Email"                 value={detail.pf_email} />
                    <Row label="Mobile"                value={detail.pf_mobile_no} />
                    <Row label="EPF 1952 Member"       value={detail.pf_epf_1952} />
                    <Row label="EPS 1995 Member"       value={detail.pf_eps_1995} />
                    {detail.pf_epf_1952==="Yes" && <Row label="UAN"              value={detail.pf_uan} />}
                    {detail.pf_epf_1952==="Yes" && <Row label="Previous PF No"   value={detail.pf_previous_pf} />}
                    <Row label="International Worker"  value={detail.pf_international_worker} />
                    <Row label="Aadhaar No"            value={detail.pf_aadhar_no} />
                    <Row label="PAN"                   value={detail.pf_pan} />
                    <Row label="Bank Account No"       value={detail.pf_bank_acc_no} />
                    <Row label="IFSC Code"             value={detail.pf_ifsc_code} />
                    <Row label="Educational Qual."     value={detail.pf_educational_qualification} />
                    <Row label="Specially Abled"       value={detail.pf_specially_abled} />
                  </Sec>

                  {/* ── Bank Details ── */}
                  <Sec icon={Landmark} title="Bank Details">
                    <Row label="Bank Name"        value={detail.bank_name} />
                    <Row label="Account Holder"   value={detail.account_holder_name} />
                    <Row label="Account No."      value={detail.account_number ? "xxxx" + detail.account_number.slice(-4) : "—"} />
                    <Row label="IFSC Code"        value={detail.ifsc_code} />
                    <Row label="Branch"           value={detail.branch_details} />
                  </Sec>

                  {/* ── Signature ── */}
                  {detail.signature_url && (
                    <Sec icon={PenLine} title="Employee Signature">
                      <img src={detail.signature_url} alt="Signature" className="h-16 object-contain border border-amber-200 rounded-lg bg-white px-3 py-2" />
                    </Sec>
                  )}

                  {/* ── Document Acknowledgments & Uploaded Documents ── */}
                  <Sec icon={FileText} title="Document Acknowledgments & Uploads">
                    {/* Handbook & Privacy Policy Acknowledgments */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between py-2 border-b border-amber-50 text-[13px]">
                        <span className="text-gray-400 text-[12px]">Employee Handbook</span>
                        <div className="flex items-center gap-2">
                          {(detail.handbook_acknowledged || detail.handbook_ack) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                              <CheckCircle size={11} /> Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
                              Not Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-amber-50 text-[13px]">
                        <span className="text-gray-400 text-[12px]">Privacy Policy / HR Policy</span>
                        <div className="flex items-center gap-2">
                          {(detail.hr_policy_acknowledged || detail.hr_policy_ack) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                              <CheckCircle size={11} /> Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">
                              Not Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Uploaded Identity Documents */}
                    <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-2 mt-3">Uploaded Documents</p>
                    <div className="space-y-2">
                      {detail.aadhar_doc_url ? (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-100 bg-amber-50/40">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-amber-700" />
                            <span className="text-[12px] font-medium text-gray-700">Aadhaar Card</span>
                          </div>
                          <a
                            href={`${process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000'}${detail.aadhar_doc_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
                            style={{backgroundColor:"#d97706"}}>
                            <ExternalLink size={11} /> View
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/20">
                          <FileText size={13} className="text-amber-300" />
                          <span className="text-[12px] text-gray-400">Aadhaar Card — not uploaded</span>
                        </div>
                      )}
                      {detail.pan_doc_url ? (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-100 bg-amber-50/40">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-amber-700" />
                            <span className="text-[12px] font-medium text-gray-700">PAN Card</span>
                          </div>
                          <a
                            href={`${process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000'}${detail.pan_doc_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
                            style={{backgroundColor:"#d97706"}}>
                            <ExternalLink size={11} /> View
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/20">
                          <FileText size={13} className="text-amber-300" />
                          <span className="text-[12px] text-gray-400">PAN Card — not uploaded</span>
                        </div>
                      )}
                    </div>
                  </Sec>

                  {/* ── Admin Fields (HR Only) ── */}
                  {["submitted","pending_verification","changes_requested","approved"].includes(detail.formality_status) && (
                    <div className="rounded-xl border-2 p-4 mb-4" style={{borderColor:"#d97706", backgroundColor:"#fef9ee"}}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{backgroundColor:"#d97706"}}>HR</div>
                        <span className="text-[12px] font-bold text-amber-900 uppercase tracking-wide">Admin Entry — Visible to HR Only</span>
                      </div>

                      {/* ── Saved values read-only display ── */}
                      {(detail.admin_employee_id || detail.admin_designation || detail.admin_reporting_to || detail.admin_department) && (
                        <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-white">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">Currently Saved</p>
                          <div className="grid grid-cols-2 gap-2">
                            {detail.admin_employee_id  && <div><p className="text-[10px] text-gray-400">Employee ID</p><p className="text-[13px] font-semibold text-gray-800">{detail.admin_employee_id}</p></div>}
                            {detail.admin_designation  && <div><p className="text-[10px] text-gray-400">Designation</p><p className="text-[13px] font-semibold text-gray-800">{detail.admin_designation}</p></div>}
                            {detail.admin_reporting_to && <div><p className="text-[10px] text-gray-400">Reporting Manager</p><p className="text-[13px] font-semibold text-gray-800">{detail.admin_reporting_to}</p></div>}
                            {detail.admin_department   && <div><p className="text-[10px] text-gray-400">Department</p><p className="text-[13px] font-semibold text-gray-800">{detail.admin_department}</p></div>}
                          </div>
                        </div>
                      )}

                      {/* ── Editable inputs ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="mb-2">
                          <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">Employee ID</label>
                          <input name="employeeId" value={adminFields.employeeId||""} onChange={af} placeholder="e.g. EMP001"
                            className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white" />
                        </div>
                        <AdminCombo  label="Designation"       name="designation"  value={adminFields.designation}  onChange={af} options={DESIGNATION_LIST} listId="desig-list"  placeholder="Select or type designation..." />
                        <AdminSelect label="Reporting Manager" name="reportingTo"  value={adminFields.reportingTo}  onChange={af} options={managers}                                        placeholder="Select manager..." />
                        <AdminCombo  label="Department"        name="department"   value={adminFields.department}   onChange={af} options={DEPARTMENT_LIST}  listId="dept-list"   placeholder="Select or type department..." />
                      </div>
                      {detail.formality_status === "approved" && (
                        <div className="mt-3 flex justify-end">
                          <button onClick={saveAdminFieldsOnly} disabled={reviewing}
                            className="px-4 py-1.5 text-[12px] font-semibold text-white rounded-lg disabled:opacity-60"
                            style={{backgroundColor:"#d97706"}}>
                            {reviewing ? "Saving…" : "Save Details"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── HR Decision ── */}
                  {["submitted","pending_verification","changes_requested"].includes(detail.formality_status) && (
                    <div className="border-t border-amber-100 pt-4 space-y-3">
                      <p className="text-[13px] font-semibold text-gray-700">HR Decision</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key:"approve",         label:"Approve",         cls:"text-emerald-700 bg-emerald-50 border-emerald-200", ring:"ring-emerald-400", icon:CheckCircle },
                          { key:"request_changes", label:"Request Changes", cls:"text-amber-700 bg-amber-50 border-amber-200",       ring:"ring-amber-400",   icon:AlertTriangle },
                          { key:"reject",          label:"Reject",          cls:"text-red-700 bg-red-50 border-red-200",             ring:"ring-red-400",     icon:XCircle },
                        ].map(({ key, label, cls, ring, icon: Icon }) => (
                          <button key={key} onClick={() => setDecision(key)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${cls} ${decision===key?`ring-2 ring-offset-1 ${ring}`:""}`}>
                            <Icon size={13} /> {label}
                          </button>
                        ))}
                      </div>
                      <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                        placeholder={decision==="request_changes" ? "Specify which fields need correction..." : "Remarks (optional)"}
                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 resize-none"
                        style={{"--tw-ring-color":"#d97706"}} />
                    </div>
                  )}

                  {detail.formality_status==="approved" && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3">
                      <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-[13px] text-emerald-700 font-medium">Formality approved. Employee onboarding complete.</p>
                    </div>
                  )}
                  {detail.formality_status==="rejected" && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
                      <XCircle size={18} className="text-red-600 flex-shrink-0" />
                      <p className="text-[13px] text-red-700 font-medium">Formality rejected.{detail.hr_remarks ? ` Reason: ${detail.hr_remarks}` : ""}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-amber-100 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => { setDetailId(null); setDetail(null); setSelectedRow(null); }}
                className="px-4 py-2 text-[13px] font-medium border rounded-lg"
                style={{color:"#d97706", borderColor:"#d97706", backgroundColor:"#fff"}}>
                Close
              </button>
              {decision && (
                <button onClick={submitReview} disabled={reviewing}
                  className="px-4 py-2 text-[13px] font-medium text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{backgroundColor:"#d97706"}}>
                  {reviewing ? "Submitting..." : "Confirm Decision"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
