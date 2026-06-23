import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Clock3,
  FileText,
  Star,
  Upload,
  User2,
  X,
} from "lucide-react";
import { listEmployees } from "../../api/employee.api";
import { listDocuments, uploadDocument } from "../../api/document.api";
import { errorToast, successToast } from "../../utils/ToastControllers";
import { API_BASE_URL } from "../../api/client";
import "./Onboarding.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ONBOARDING_DAYS = 90;

function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function progressFromDays(days) {
  if (days <= 1) return 10;
  if (days <= 7) return 30;
  if (days <= 14) return 55;
  if (days <= 30) return 75;
  if (days <= 60) return 88;
  return 100;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(first, last) {
  return `${(first || "?")[0]}${(last || "")[0] || ""}`.toUpperCase();
}

function fileUrl(relPath) {
  if (!relPath) return "#";
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${base}${relPath}`;
}

// ── Standard onboarding checklist template ────────────────────────────────────
const CHECKLIST_TEMPLATE = [
  {
    section: "Pre-boarding",
    items: [
      {
        title: "Complete I-9 and tax forms",
        description: "Submit all required employment verification and tax documents through the HR portal.",
        dueDays: 0,
      },
    ],
  },
  {
    section: "Day 1",
    items: [
      {
        title: "Set up workstation and install software",
        description: "Configure laptop, install required tools, clone repositories, and set up access.",
        dueDays: 1,
      },
      {
        title: "Attend company orientation",
        description: "Attend the orientation covering company values, org structure, and benefits.",
        dueDays: 1,
      },
      {
        title: "Meet your onboarding buddy",
        description: "30-minute catch-up with your assigned buddy to get acquainted.",
        dueDays: 1,
      },
    ],
  },
  {
    section: "Week 1",
    items: [
      {
        title: "Explore role and team workflows",
        description: "Deep dive into responsibilities, team processes, and coding/operational conventions.",
        dueDays: 7,
      },
      {
        title: "Shadow a senior team member",
        description: "Observe a senior colleague conducting their work to learn conventions.",
        dueDays: 7,
      },
      {
        title: "Attend team all-hands",
        description: "Join the weekly team meeting to learn about current priorities.",
        dueDays: 7,
      },
    ],
  },
  {
    section: "Month 1",
    items: [
      {
        title: "Complete security awareness training",
        description: "Finish the online security training and phishing simulation exercise.",
        dueDays: 21,
      },
      {
        title: "30-day check-in with manager",
        description: "Discuss how the first month went and set short-term goals.",
        dueDays: 30,
      },
    ],
  },
];

function buildChecklist(days) {
  return CHECKLIST_TEMPLATE.map((group) => {
    const items = group.items.map((item) => ({
      ...item,
      status: days > item.dueDays ? "Completed" : "Pending",
    }));
    const completed = items.filter((i) => i.status === "Completed").length;
    return { ...group, items, completed, total: items.length };
  });
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadDocumentModal({ employee, onClose, onUploaded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { errorToast("Please select a file"); return; }
    if (!title.trim()) { errorToast("Please enter a document title"); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("employee_id", employee.employee_id);
    fd.append("visibility", "private");

    setUploading(true);
    try {
      await uploadDocument(fd);
      successToast(`Document uploaded for ${employee.first_name}`);
      onUploaded();
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload Document</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              For {employee.first_name} {employee.last_name || ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Offer Letter, I-9 Form, NDA"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 cursor-pointer hover:border-brand transition-colors">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-500">
                {file ? file.name : "Click to choose a file"}
              </span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
            </label>
            {file && <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="flex-1 btn-primary py-2 text-sm disabled:opacity-60">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [employeeDocs, setEmployeeDocs] = useState({});
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listEmployees({ limit: 200, status: "active" })
      .then(({ data }) => setEmployees(data || []))
      .catch(() => errorToast("Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  const { activeOnboardings, completedOnboardings } = useMemo(() => {
    const active = [];
    const completed = [];
    employees.forEach((emp) => {
      if (daysSince(emp.date_of_joining) <= ONBOARDING_DAYS) active.push(emp);
      else completed.push(emp);
    });
    return { activeOnboardings: active, completedOnboardings: completed };
  }, [employees]);

  const overdueTasks = useMemo(() => {
    return activeOnboardings
      .filter((emp) => daysSince(emp.date_of_joining) > 7)
      .flatMap((emp) => {
        const days = daysSince(emp.date_of_joining);
        return CHECKLIST_TEMPLATE.flatMap((group) =>
          group.items
            .filter((item) => item.dueDays <= days - 7)
            .map((item) => ({
              title: item.title,
              owner: `${emp.first_name} ${emp.last_name || ""}`.trim(),
              dueDays: item.dueDays,
            }))
        );
      })
      .slice(0, 5);
  }, [activeOnboardings]);

  const loadDocsForEmployee = useCallback(
    async (emp) => {
      if (!emp) return;
      const id = emp.employee_id;
      if (employeeDocs[id] !== undefined) return;
      setDocsLoading(true);
      try {
        const { data } = await listDocuments({ employee_id: id, limit: 100 });
        setEmployeeDocs((prev) => ({ ...prev, [id]: data || [] }));
      } catch {
        setEmployeeDocs((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setDocsLoading(false);
      }
    },
    [employeeDocs]
  );

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    loadDocsForEmployee(emp);
  };

  const handleAfterUpload = useCallback(() => {
    if (!uploadTarget) return;
    const id = uploadTarget.employee_id;
    setEmployeeDocs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // Re-fetch after short delay so server has persisted the file
    setTimeout(() => {
      setDocsLoading(true);
      listDocuments({ employee_id: id, limit: 100 })
        .then(({ data }) => setEmployeeDocs((prev) => ({ ...prev, [id]: data || [] })))
        .catch(() => {})
        .finally(() => setDocsLoading(false));
    }, 500);
  }, [uploadTarget]);

  const selectedDays = selectedEmployee ? daysSince(selectedEmployee.date_of_joining) : 0;
  const selectedChecklist = selectedEmployee ? buildChecklist(selectedDays) : [];
  const selectedProgress = selectedEmployee ? progressFromDays(selectedDays) : 0;
  const selectedDocs = selectedEmployee ? (employeeDocs[selectedEmployee.employee_id] || []) : [];

  const avgDays = useMemo(() => {
    if (!activeOnboardings.length) return "—";
    const total = activeOnboardings.reduce((sum, e) => sum + daysSince(e.date_of_joining), 0);
    return `${Math.round(total / activeOnboardings.length)}d`;
  }, [activeOnboardings]);

  const overviewStats = [
    { value: loading ? "…" : activeOnboardings.length, label: "Active Onboardings", icon: <User2 size={18} /> },
    { value: loading ? "…" : avgDays, label: "Avg Days in Onboarding", icon: <Clock3 size={18} /> },
    { value: "4.6/5", label: "Satisfaction Score", icon: <Star size={18} /> },
  ];

  return (
    <div className="admin-onboarding space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Onboarding</h1>
            <p className="text-sm text-slate-500">Track and manage new hire onboarding progress</p>
          </div>
          <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Updated today</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {overviewStats.map((stat) => (
            <div key={stat.label} className="onboarding-stat-card">
              <div className="onboarding-stat-card__icon">{stat.icon}</div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <section className="onboarding-overdue-panel">
          <div className="onboarding-overdue-header">
            <p className="text-sm font-semibold text-amber-800">Overdue Tasks ({overdueTasks.length})</p>
            <span className="onboarding-overdue-tag">Review now</span>
          </div>
          <div className="onboarding-overdue-list">
            {overdueTasks.map((task, i) => (
              <div key={i} className="onboarding-overdue-item">
                <div>
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="text-sm text-slate-500">{task.owner} · Due Day {task.dueDays}</p>
                </div>
                <span className="onboarding-overdue-status">Overdue</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Onboardings */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Active Onboardings</h2>
          <p className="text-sm text-slate-500">New hires within the first 90 days.</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading employees…</p>
        ) : activeOnboardings.length === 0 ? (
          <p className="text-sm text-slate-400">No active onboardings at the moment.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {activeOnboardings.map((emp) => {
              const days = daysSince(emp.date_of_joining);
              const progress = progressFromDays(days);
              return (
                <div key={emp.employee_id} className="onboarding-card">
                  <div className="onboarding-card__top">
                    <div>
                      <div className="onboarding-avatar">{initials(emp.first_name, emp.last_name)}</div>
                      <div className="mt-3">
                        <p className="text-lg font-semibold text-slate-900">
                          {emp.first_name} {emp.last_name || ""}
                        </p>
                        <p className="text-sm text-slate-500">
                          {emp.designation_name || "—"}{emp.department_name ? ` · ${emp.department_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="onboarding-active-badge">Active</span>
                      <button
                        type="button"
                        onClick={() => setUploadTarget(emp)}
                        className="flex items-center gap-1 text-xs text-brand border border-brand rounded-lg px-3 py-1.5 hover:bg-brand-50"
                      >
                        <Upload size={12} /> Upload Doc
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500">
                    <div>
                      <p className="font-medium text-slate-900">Start Date</p>
                      <p className="mt-1">{formatDate(emp.date_of_joining)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Department</p>
                      <p className="mt-1">{emp.department_name || "—"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Days Onboarding</p>
                      <p className="mt-1">{days} days</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Progress</p>
                      <p className="mt-1">{progress}%</p>
                    </div>
                  </div>

                  <div className="onboarding-progress-bar">
                    <div className="onboarding-progress-bar__fill" style={{ width: `${progress}%` }} />
                  </div>

                  <button
                    type="button"
                    className="onboarding-view-checklist"
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    View Checklist &amp; Documents <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Checklist + Documents Panel */}
      {selectedEmployee && (
        <section className="onboarding-checklist-panel">
          <div className="onboarding-checklist-header">
            <div>
              <p className="text-sm text-slate-500">
                {selectedEmployee.designation_name || "—"} · {selectedEmployee.department_name || "—"}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {selectedEmployee.first_name} {selectedEmployee.last_name || ""}
              </h2>
              <div className="flex flex-wrap gap-3 items-center text-sm text-slate-500 mt-3">
                <span>Started {formatDate(selectedEmployee.date_of_joining)}</span>
                <span>· Day {selectedDays} of 90</span>
              </div>
            </div>
            <div className="onboarding-checklist-actions">
              <button
                type="button"
                className="onboarding-custom-task-btn"
                onClick={() => setUploadTarget(selectedEmployee)}
              >
                + Upload Document
              </button>
              <div className="onboarding-checklist-progress-circle">
                <span>{selectedProgress}%</span>
              </div>
            </div>
          </div>

          <div className="onboarding-checklist-groups">
            {selectedChecklist.map((group) => (
              <div key={group.section} className="onboarding-group-card">
                <div className="onboarding-group-header">
                  <div>
                    <p className="font-semibold text-slate-900">{group.section}</p>
                    <p className="text-sm text-slate-500">{group.completed}/{group.total} completed</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.items.map((task) => (
                    <div key={task.title} className="onboarding-task-item">
                      <div className="onboarding-task-status">
                        <span className={`onboarding-task-dot ${task.status === "Completed" ? "completed" : "pending"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        <div className="flex flex-wrap gap-2 items-center mt-2 text-xs text-slate-400">
                          <span>Due: Day {task.dueDays}</span>
                          <span className={`onboarding-task-badge ${task.status === "Completed" ? "completed" : "pending"}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Documents section */}
            <div className="onboarding-group-card">
              <div className="onboarding-group-header">
                <div>
                  <p className="font-semibold text-slate-900">Uploaded Documents</p>
                  <p className="text-sm text-slate-500">
                    {docsLoading ? "Loading…" : `${selectedDocs.length} document${selectedDocs.length !== 1 ? "s" : ""} uploaded`}
                  </p>
                </div>
                <button
                  type="button"
                  className="onboarding-custom-task-btn"
                  onClick={() => setUploadTarget(selectedEmployee)}
                >
                  <Upload size={13} className="inline mr-1" />Upload
                </button>
              </div>

              {docsLoading ? (
                <p className="text-sm text-slate-400 py-4 text-center">Loading documents…</p>
              ) : selectedDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <FileText size={32} className="opacity-30" />
                  <p className="text-sm">No documents uploaded yet.</p>
                  <button
                    type="button"
                    className="text-sm text-brand hover:underline mt-1"
                    onClick={() => setUploadTarget(selectedEmployee)}
                  >
                    Upload first document
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDocs.map((doc) => (
                    <div
                      key={doc.document_id}
                      className="flex items-center justify-between border border-slate-100 rounded-lg px-4 py-3 bg-slate-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} className="text-brand shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-slate-500 truncate">{doc.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {doc.file_type} · {doc.file_size} · {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={fileUrl(doc.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-brand border border-brand rounded px-3 py-1 hover:bg-brand-50 ml-4"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Completed Onboardings */}
      <section className="onboarding-completed-panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Completed Onboardings ({completedOnboardings.length})
            </h2>
            <p className="text-sm text-slate-500">Employees who passed the 90-day mark.</p>
          </div>
          <span className="onboarding-completed-badge">Closed</span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 mt-2">Loading…</p>
        ) : completedOnboardings.length === 0 ? (
          <p className="text-sm text-slate-400 mt-2">None yet.</p>
        ) : (
          <div className="space-y-3 mt-4">
            {completedOnboardings.map((emp) => (
              <div key={emp.employee_id} className="onboarding-completed-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="onboarding-avatar">{initials(emp.first_name, emp.last_name)}</div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {emp.first_name} {emp.last_name || ""}
                      </p>
                      <p className="text-sm text-slate-500">
                        {emp.designation_name || "—"} · Started {formatDate(emp.date_of_joining)}
                      </p>
                      {emp.department_name && (
                        <p className="text-sm text-slate-400">{emp.department_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="onboarding-completed-progress">
                    <span className="text-sm font-semibold text-slate-900">100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upload Modal */}
      {uploadTarget && (
        <UploadDocumentModal
          employee={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleAfterUpload}
        />
      )}
    </div>
  );
}
