import React, { useState } from "react";
import { X, ChevronDown, Paperclip, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Select Category.." },
  { value: "it", label: "IT Support" },
  { value: "hr", label: "HR Query" },
  { value: "payroll", label: "Payroll" },
  { value: "facilities", label: "Facilities" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "high", label: "High", dot: "bg-red-500" },
  { value: "medium", label: "Medium", dot: "bg-amber-400" },
  { value: "low", label: "Low", dot: "bg-emerald-500" },
];

const FILE_TYPES =
  "File Types: pdf, .xls, .xlsx, .doc, .docx, .txt, .ppt, .pptx, .gif, .jpg, .jpeg, .png";

export default function NewRequestModal({ open, onClose, onSubmit }) {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("high");
  const [ccList, setCcList] = useState([]);

  if (!open) return null;

  const reset = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("high");
    setCcList([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    onSubmit({
      category: CATEGORIES.find((c) => c.value === category)?.label || "General",
      subject: subject.trim(),
      description: description.trim(),
      priority,
      cc: ccList,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    reset();
    onClose();
  };

  const priorityMeta = PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25">
      <div
        className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden"
        role="dialog"
        aria-labelledby="new-request-title"
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 border-b border-slate-200">
          <h2
            id="new-request-title"
            className="text-base font-medium text-slate-600"
          >
            New Request
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none border border-slate-200 rounded-md py-2.5 pl-3 pr-9 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line.."
              className="w-full border border-slate-200 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write here.."
              rows={5}
              className="w-full border border-slate-200 rounded-md py-2.5 px-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-sky-400"
              required
            />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700"
            >
              <Paperclip size={16} />
              Attach File
            </button>
            <span className="text-[11px] text-slate-400 leading-snug max-w-md text-right">
              {FILE_TYPES}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pt-1">
            <div>
              <label className="block text-xs text-slate-500 mb-2">CC to</label>
              <button
                type="button"
                onClick={() =>
                  setCcList((prev) => [...prev, `colleague${prev.length + 1}@natit.com`])
                }
                className="inline-flex items-center gap-2 text-sky-600 text-sm font-medium"
              >
                <span className="w-8 h-8 rounded-full border-2 border-sky-500 flex items-center justify-center">
                  <Plus size={18} strokeWidth={2} />
                </span>
                Add
              </button>
              {ccList.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {ccList.map((email, i) => (
                    <li key={i} className="text-xs text-slate-600">
                      {email}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sm:w-48">
              <label className="block text-xs text-slate-500 mb-1.5">Priority</label>
              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${priorityMeta.dot}`}
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full appearance-none border border-slate-200 rounded-md py-2.5 pl-7 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              type="submit"
              className="min-w-[120px] py-2.5 text-sm font-medium rounded-md border border-sky-500 text-sky-600 bg-white hover:bg-sky-50"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="min-w-[120px] py-2.5 text-sm font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
