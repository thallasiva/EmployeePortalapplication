import React from "react";
import {
  FileText, Receipt, ClipboardList, BookOpen,
  FolderOpen, Mail, ArrowRight, CheckCircle2, Clock3,
  Sparkles, ChevronRight
} from "lucide-react";
import { VIEW } from "../constants";

const BRAND = "#f18200";

const DOC_CARDS = [
  {
    view: VIEW.DOCUMENTS,
    icon: FolderOpen,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    title: "Documents",
    desc: "Offer letters, ID proofs & personal files",
  },
  {
    view: VIEW.PAYSLIPS,
    icon: Receipt,
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    title: "Payslips",
    desc: "Monthly salary statements",
  },
  {
    view: VIEW.FORM16,
    icon: ClipboardList,
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
    title: "Form 16",
    desc: "Annual tax certificates",
  },
  {
    view: VIEW.POLICIES,
    icon: BookOpen,
    color: "#059669",
    bg: "#f0fdf4",
    border: "#a7f3d0",
    title: "Company Policies",
    desc: "HR policies & code of conduct",
  },
  {
    view: VIEW.FORMS,
    icon: FileText,
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
    title: "Forms",
    desc: "Tax, statutory & declaration forms",
  },
];

const HomeView = React.memo(function HomeView({ setView }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#f8f9fc] -m-4 p-6 space-y-7">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 flex items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d1b69 60%, #f18200 100%)" }}
      >
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-orange-300" />
            <span className="text-[12px] font-semibold text-orange-300 uppercase tracking-widest">
              Document Center
            </span>
          </div>
          <h2 className="text-[26px] font-bold text-white leading-snug">
            We've got it sorted for you!
          </h2>
          <p className="text-[14px] text-white/70 mt-1.5 max-w-md">
            All your documents are now in one place — payslips, policies, tax forms and more.
          </p>
          <p className="text-[13px] text-orange-300 mt-1">
            Can't find a letter? Request one instantly.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: BRAND }} />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: "#7c3aed" }} />
        <div className="hidden sm:flex flex-col items-center gap-2 z-10 flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <FolderOpen size={32} className="text-orange-300" />
          </div>
        </div>
      </div>

      {/* ── Document Categories ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-gray-800">Documents</h3>
          <span className="text-[12px] text-gray-400">{DOC_CARDS.length} categories</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {DOC_CARDS.map(({ view, icon: Icon, color, bg, border, title, desc }) => (
            <button
              key={view}
              type="button"
              onClick={() => setView(view)}
              className="group relative bg-white rounded-2xl border p-4 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: bg }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <p className="text-[14px] font-bold text-gray-800 mb-0.5">{title}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
              <div
                className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color }}
              >
                View All <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Letter Requests ─────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-bold text-gray-800">Request a Letter</h3>
        <button
          type="button"
          onClick={() => setView(VIEW.LETTERS)}
          className="group w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-800">Letters</p>
                <p className="text-[11px] text-gray-400">
                  Experience, relieving, salary & more
                </p>
              </div>
            </div>
            <ArrowRight
              size={16}
              className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
            />
          </div>

          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <Clock3 size={13} className="text-orange-400" />
              <span className="text-[12px] text-gray-500">
                Pending: <span className="font-semibold text-orange-500">0</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="text-[12px] text-gray-500">
                Closed: <span className="font-semibold text-emerald-600">0</span>
              </span>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
});

export default HomeView;
