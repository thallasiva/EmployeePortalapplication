import React from "react";
import { FileText, Upload } from "lucide-react";
import { formatDate, fileUrl } from "../utils";

const ChecklistPanel = React.memo(function ChecklistPanel({
  selectedEmployee,
  selectedDays,
  selectedChecklist,
  selectedProgress,
  selectedDocs,
  docsLoading,
  onUpload,
}) {
  if (!selectedEmployee) return null;

  return (
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
            onClick={() => onUpload(selectedEmployee)}
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
                <p className="text-sm text-slate-500">
                  {group.completed}/{group.total} completed
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {group.items.map((task) => (
                <div key={task.title} className="onboarding-task-item">
                  <div className="onboarding-task-status">
                    <span
                      className={`onboarding-task-dot ${
                        task.status === "Completed" ? "completed" : "pending"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                    <div className="flex flex-wrap gap-2 items-center mt-2 text-xs text-slate-400">
                      <span>Due: Day {task.dueDays}</span>
                      <span
                        className={`onboarding-task-badge ${
                          task.status === "Completed" ? "completed" : "pending"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Uploaded Documents */}
        <div className="onboarding-group-card">
          <div className="onboarding-group-header">
            <div>
              <p className="font-semibold text-slate-900">Uploaded Documents</p>
              <p className="text-sm text-slate-500">
                {docsLoading
                  ? "Loading…"
                  : `${selectedDocs.length} document${selectedDocs.length !== 1 ? "s" : ""} uploaded`}
              </p>
            </div>
            <button
              type="button"
              className="onboarding-custom-task-btn"
              onClick={() => onUpload(selectedEmployee)}
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
                onClick={() => onUpload(selectedEmployee)}
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
                        {doc.file_type} · {doc.file_size} ·{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
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
  );
});

export default ChecklistPanel;
