import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Search,
} from "lucide-react";
import { downloadPayslip, viewPayslip } from "../../../utils/payslipDownload";
import { errorToast, successToast } from "../../../utils/ToastControllers";
import { getMyDocuments } from "../../../api/document.api";
import { API_BASE_URL } from "../../../api/client";

const VIEW = {
  HOME: "home",
  DOCUMENTS: "documents",
  PAYSLIPS: "payslips",
  FORM16: "form16",
  POLICIES: "policies",
  FORMS: "forms",
  LETTERS: "letters",
};

function EmptyDocIllustration() {
  return (
    <svg width="120" height="110" viewBox="0 0 120 110" fill="none" aria-hidden>
      <path d="M36 16h34l14 14v52a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z" fill="#f4f7fb" stroke="#b7c7dc" />
      <path d="M70 16v16h16" stroke="#b7c7dc" />
      <path d="M42 48h30M42 57h30M42 66h24" stroke="#b7c7dc" strokeLinecap="round" />
      <circle cx="88" cy="76" r="11" fill="#eef3f9" stroke="#b7c7dc" />
      <path d="M88 70v12M82 76h12" stroke="#9eb2cc" strokeLinecap="round" />
    </svg>
  );
}

function HeroIllustration() {
  return (
    <svg width="130" height="70" viewBox="0 0 130 70" fill="none" aria-hidden>
      <circle cx="72" cy="18" r="8" fill="#f5c7a5" />
      <rect x="64" y="26" width="16" height="20" rx="4" fill="#6ea8dc" />
      <rect x="62" y="46" width="7" height="18" rx="3" fill="#2f4f6f" />
      <rect x="75" y="46" width="7" height="18" rx="3" fill="#2f4f6f" />
      <rect x="96" y="18" width="4" height="28" fill="#9aa3ad" />
      <rect x="88" y="14" width="20" height="6" rx="3" fill="#cfd7df" />
      <path d="M14 62h102" stroke="#d9dee3" />
    </svg>
  );
}

function Card({ icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-[#e8edf3] h-[52px] px-4 flex items-center justify-between text-left hover:shadow-sm"
    >
      <span className="inline-flex items-center gap-2 text-[13px] text-[#2f3a4a]">
        {icon}
        {title}
      </span>
      <span className="text-[12px] text-[#5a78ad]">View All</span>
    </button>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-[13px] font-semibold text-[#3a4558] mb-2">{children}</h3>;
}

function toJumpId(value) {
  return `jump-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function scrollElementIntoContainer(el) {
  const container = el.closest("[data-doc-scroll]");
  if (container) {
    const elTop = el.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    container.scrollTo({
      top: container.scrollTop + (elTop - containerTop) - 8,
      behavior: "smooth",
    });
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const POLICIES = [
  {
    id: "information-security",
    jumpLabel: "Information Security",
    title: "Information Security Policy",
    date: "17 Jun, 2021",
    file: "Information Security Policy.pdf",
    description:
      "NAT IT is committed to maintaining and improving information security within its practices and minimizing risk exposure.",
  },
  {
    id: "instant-messenger",
    jumpLabel: "Instant Messenger Usage",
    title: "Instant Messenger Usage Policy",
    date: "17 Jun, 2021",
    file: "Instant Messenger Usage Policy.pdf",
    description:
      "Guidelines for appropriate use of instant messaging tools for business communication.",
  },
  {
    id: "privacy",
    jumpLabel: "Privacy",
    title: "Privacy Policy",
    date: "17 Jun, 2021",
    file: "Privacy Policy.pdf",
    description:
      "How employee and customer data is collected, used, stored, and protected.",
  },
  {
    id: "desktop-usage",
    jumpLabel: "Desktop Usage",
    title: "Desktop Usage Policy",
    date: "17 Jun, 2021",
    file: "Desktop Usage Policy.pdf",
    description:
      "Standards for secure and acceptable use of company desktops and workstations.",
  },
  {
    id: "employee-handbook",
    jumpLabel: "Employee Handbook",
    title: "Employee Handbook",
    date: "17 Jun, 2021",
    file: "Employee Handbook.pdf",
    description:
      "Overview of company culture, policies, benefits, and workplace expectations.",
  },
  {
    id: "code-of-conduct",
    jumpLabel: "Code of Business Conduct",
    title: "Code of Business Conduct, Ethics, Harassment and Abuse Policy",
    date: "17 Jun, 2021",
    file: "Code of Business Conduct.pdf",
    description:
      "Ethical standards, anti-harassment guidelines, and reporting procedures for all employees.",
  },
];

const FORM16_YEARS = ["2025-26", "2024-25", "2023-24"];

const FORM_SECTIONS = [
  { id: "tax-forms", jumpLabel: "Tax Forms", title: "Tax Forms" },
  { id: "statutory-forms", jumpLabel: "Statutory Forms", title: "Statutory Forms" },
  { id: "declaration-forms", jumpLabel: "Declaration Forms", title: "Declaration Forms" },
];

const LETTER_SECTIONS = [
  { id: "pending-letters", jumpLabel: "Pending", title: "Pending Requests" },
  { id: "closed-letters", jumpLabel: "Closed", title: "Closed Requests" },
];

function JumpList({ title = "JUMP TO", items, onJump }) {
  return (
    <aside className="w-[170px] border-r border-[#edf1f5] px-3 py-3 shrink-0">
      <p className="text-[11px] text-[#a3afbf] mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onJump?.(item)}
            className="block text-[13px] text-[#5b6778] hover:text-[#1890ff] text-left"
          >
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
}

function PanelTitle({ children }) {
  return (
    <h2 className="text-[20px] text-[#3a4558] font-semibold mb-3 border-b border-[#d7deea] pb-2 inline-block">
      {children}
    </h2>
  );
}

function DocumentCenter() {
  const [view, setView] = useState(VIEW.HOME);
  const [docSectionOpen, setDocSectionOpen] = useState({
    address: true,
    accounts: true,
  });
  const [docItemOpen, setDocItemOpen] = useState({
    presentAddress: false,
    bankAccount: false,
    pan: false,
  });
  const [payslipYearOpen, setPayslipYearOpen] = useState({
    2026: true,
    2025: false,
    2024: false,
  });
  const [payslipMonthOpen, setPayslipMonthOpen] = useState({
    "Mar 2026": true,
  });
  const [policyOpen, setPolicyOpen] = useState({
    "information-security": true,
  });
  const [policyDetailOpen, setPolicyDetailOpen] = useState({
    "information-security": true,
  });
  const [form16YearOpen, setForm16YearOpen] = useState({
    "2025-26": true,
  });
  const [formSectionOpen, setFormSectionOpen] = useState({
    "tax-forms": true,
  });
  const [letterSectionOpen, setLetterSectionOpen] = useState({
    "pending-letters": true,
  });

  // ── Dynamic documents from API ──────────────────────────────────────────────
  const [myDocs, setMyDocs] = useState(null); // null = not loaded yet
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    if (view !== VIEW.DOCUMENTS || myDocs !== null) return;
    setDocsLoading(true);
    getMyDocuments({ limit: 200 })
      .then(({ data }) => setMyDocs(data || []))
      .catch(() => { errorToast("Failed to load documents"); setMyDocs([]); })
      .finally(() => setDocsLoading(false));
  }, [view, myDocs]);

  // Group documents by category (or "General")
  const docsByCategory = useMemo(() => {
    if (!myDocs) return {};
    const groups = {};
    myDocs.forEach((doc) => {
      const cat = doc.category_name || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    });
    return groups;
  }, [myDocs]);

  function docFileUrl(relPath) {
    if (!relPath) return "#";
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}${relPath}`;
  }

  const payslipRows = useMemo(
    () => [
      { month: "Apr 2026", text: "Payroll for the month of Apr 2026", date: "01 May, 2026", file: null },
      { month: "Mar 2026", text: "Payroll for the month of Mar 2026", date: "06 Apr, 2026", file: "Mar 2026.pdf" },
      { month: "Feb 2026", text: "Payroll for the month of Feb 2026", date: "03 Mar, 2026", file: null },
      { month: "Jan 2026", text: "Payroll for the month of Jan 2026", date: "02 Feb, 2026", file: null },
      { month: "Dec 2025", text: "Payroll for the month of Dec 2025", date: "06 Jan, 2026", file: null },
      { month: "Nov 2025", text: "Payroll for the month of Nov 2025", date: "08 Dec, 2025", file: null },
    ],
    []
  );
  const payslipByYear = useMemo(
    () => ({
      "2026": payslipRows.filter((row) => row.month.includes("2026")),
      "2025": payslipRows.filter((row) => row.month.includes("2025")),
      "2024": [],
    }),
    [payslipRows]
  );
  const scrollToJump = (label) => {
    const el = document.getElementById(toJumpId(label));
    if (el) {
      scrollElementIntoContainer(el);
    }
  };

  const jumpToSection = (jumpId, expand) => {
    if (expand) {
      expand();
    }
    setTimeout(() => scrollToJump(jumpId), 0);
  };

  const handleViewPayslip = (row) => {
    try {
      viewPayslip(row);
    } catch {
      errorToast("Unable to open payslip.");
    }
  };

  const handleDownloadPayslip = async (row) => {
    try {
      await downloadPayslip(row);
      successToast(`Downloaded ${row.file}`);
    } catch {
      errorToast("Unable to download payslip.");
    }
  };

  if (view === VIEW.HOME) {
    return (
      <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
        <div className="bg-white border border-[#e6ebf2] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-[26px] font-semibold text-[#2f3a4a]">We&apos;ve got it sorted for you!</h2>
            <p className="text-[14px] text-[#7a8799] mt-2">All Documents are now in one place..</p>
            <p className="text-[14px] text-[#7a8799]">
              You can now request a new letter if you don&apos;t find the one you were looking for..
            </p>
          </div>
          <HeroIllustration />
        </div>

        <div className="mt-4">
          <SectionTitle>Documents</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Card icon={<FileText size={14} className="text-[#8b6fb3]" />} title="Documents" onClick={() => setView(VIEW.DOCUMENTS)} />
            <Card icon={<FileText size={14} className="text-[#d6a861]" />} title="Payslips" onClick={() => setView(VIEW.PAYSLIPS)} />
            <Card icon={<FileText size={14} className="text-[#dd869f]" />} title="Form 16" onClick={() => setView(VIEW.FORM16)} />
            <Card icon={<FileText size={14} className="text-[#73b695]" />} title="Company Policies" onClick={() => setView(VIEW.POLICIES)} />
            <Card icon={<FileText size={14} className="text-[#dd869f]" />} title="Forms" onClick={() => setView(VIEW.FORMS)} />
          </div>
        </div>

        <div className="mt-4 max-w-[240px]">
          <SectionTitle>Request</SectionTitle>
          <button
            type="button"
            onClick={() => setView(VIEW.LETTERS)}
            className="w-full bg-white border border-[#e8edf3] p-3 text-left hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[13px] text-[#2f3a4a]">
                <FileText size={14} className="text-[#6ea8dc]" />
                Letters
              </span>
              <span className="text-[12px] text-[#5a78ad]">View All</span>
            </div>
            <div className="mt-2 text-[12px] text-[#8d98a8] flex justify-between">
              <span>Pending: 0</span>
              <span>Closed: 0</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (view === VIEW.DOCUMENTS) {
    const categoryNames = Object.keys(docsByCategory);
    return (
      <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
        <PanelTitle>Documents</PanelTitle>

        {docsLoading ? (
          <div className="border border-[#dfe5ed] bg-white min-h-[200px] flex items-center justify-center">
            <p className="text-[13px] text-[#9ca8b8]">Loading your documents…</p>
          </div>
        ) : !myDocs || myDocs.length === 0 ? (
          <div className="border border-[#dfe5ed] bg-white min-h-[300px] flex flex-col items-center justify-center gap-3 p-8">
            <FileText size={40} className="text-[#c8d3e0]" />
            <p className="text-[16px] text-[#7a8799]">No documents yet</p>
            <p className="text-[13px] text-[#a2adbd] text-center">
              Documents shared with you by HR will appear here.
            </p>
          </div>
        ) : (
          <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
            <JumpList
              items={categoryNames.length > 0 ? categoryNames : ["Documents"]}
              onJump={(item) => scrollToJump(item)}
            />
            <div className="flex-1 p-3 space-y-3 max-h-[520px] overflow-y-auto" data-doc-scroll>
              {categoryNames.map((cat) => {
                const docs = docsByCategory[cat];
                const lastUpdated = docs.reduce((latest, d) => {
                  const t = new Date(d.created_at).getTime();
                  return t > latest ? t : latest;
                }, 0);
                const lastUpdatedStr = lastUpdated
                  ? new Date(lastUpdated).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
                  : "";

                return (
                  <div key={cat} id={toJumpId(cat)} className="border border-[#dfe5ed]">
                    <button
                      type="button"
                      onClick={() =>
                        setDocSectionOpen((curr) => ({ ...curr, [cat]: !curr[cat] }))
                      }
                      className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left"
                    >
                      <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                        {docSectionOpen[cat] !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {cat}
                        <span className="ml-2 text-[11px] font-normal text-[#a4afbf]">
                          ({docs.length})
                        </span>
                      </h4>
                      {lastUpdatedStr && (
                        <span className="text-[11px] text-[#a4afbf]">Last updated {lastUpdatedStr}</span>
                      )}
                    </button>

                    {docSectionOpen[cat] !== false && (
                      <div className="p-3 space-y-2">
                        {docs.map((doc) => (
                          <div key={doc.document_id} className="flex items-center justify-between border border-[#e8edf3] rounded px-3 py-2 bg-[#fafbfc]">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={14} className="text-[#8b9fc0] shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-[#3a4558] truncate">{doc.title}</p>
                                {doc.description && (
                                  <p className="text-[11px] text-[#9ca8b8] truncate">{doc.description}</p>
                                )}
                                <p className="text-[11px] text-[#b0bac7] mt-0.5">
                                  {doc.file_type} · {doc.file_size} ·{" "}
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0 ml-3">
                              <a
                                href={docFileUrl(doc.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-[#dfe5ed] h-7 px-3 text-[12px] inline-flex items-center gap-1 hover:bg-[#f0f4f9] text-[#5a78ad]"
                                title="View document"
                              >
                                <Search size={12} /> View
                              </a>
                              <a
                                href={docFileUrl(doc.file_url)}
                                download
                                className="border border-[#dfe5ed] h-7 px-3 text-[12px] inline-flex items-center gap-1 hover:bg-[#f0f4f9] text-[#8d9aad]"
                                title="Download document"
                              >
                                <Download size={12} /> Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === VIEW.PAYSLIPS) {
    const togglePayslipMonth = (month) => {
      setPayslipMonthOpen((curr) => ({
        ...curr,
        [month]: !curr[month],
      }));
    };

    return (
      <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
        <PanelTitle>Payslips</PanelTitle>
        <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
          <JumpList
            items={["2026", "2025", "2024"]}
            onJump={(item) => {
              jumpToSection(item, () =>
                setPayslipYearOpen((curr) => ({ ...curr, [item]: true }))
              );
            }}
          />
          <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
            {Object.entries(payslipByYear).map(([year, rows]) => (
              <div key={year} id={toJumpId(year)} className="border border-[#dfe5ed] mb-2 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setPayslipYearOpen((curr) => ({
                      ...curr,
                      [year]: !curr[year],
                    }))
                  }
                  className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left"
                >
                  <span className="text-[16px] font-semibold text-[#59657b] inline-flex items-center gap-1">
                    {payslipYearOpen[year] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    {year}
                  </span>
                </button>

                {payslipYearOpen[year] && (
                  <div>
                    {rows.length === 0 ? (
                      <p className="px-3 py-3 text-[12px] text-[#9ca8b8]">
                        No payslips available.
                      </p>
                    ) : (
                      rows.map((row) => {
                        const monthOpen = !!payslipMonthOpen[row.month];
                        return (
                          <div
                            key={row.month}
                            className="border-b border-[#f2f4f7] last:border-b-0"
                          >
                            <button
                              type="button"
                              onClick={() => togglePayslipMonth(row.month)}
                              className="w-full px-3 py-2 flex justify-between items-start text-left"
                            >
                              <div>
                                <div className="text-[14px] text-[#49566c] font-semibold inline-flex items-center gap-1">
                                  {monthOpen ? (
                                    <ChevronDown size={13} />
                                  ) : (
                                    <ChevronRight size={13} />
                                  )}
                                  {row.month}
                                </div>
                                <p className="text-[12px] text-[#99a5b6] ml-5">
                                  {row.text}
                                </p>
                              </div>
                              <span className="text-[11px] text-[#a4afbf] shrink-0 ml-2">
                                Last updated on {row.date}
                              </span>
                            </button>

                            {monthOpen && row.file && (
                              <div className="px-3 pb-3 ml-5">
                                <div className="border border-[#dfe5ed] h-8 px-3 text-[12px] inline-flex items-center gap-8 bg-white">
                                  <span>{row.file}</span>
                                  <span className="inline-flex gap-2 text-[#8d9aad]">
                                    <button
                                      type="button"
                                      onClick={() => handleViewPayslip(row)}
                                      className="hover:text-[#1890ff] p-0.5"
                                      aria-label={`View ${row.file}`}
                                      title="View payslip"
                                    >
                                      <Search size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadPayslip(row)}
                                      className="hover:text-[#1890ff] p-0.5"
                                      aria-label={`Download ${row.file}`}
                                      title="Download payslip"
                                    >
                                      <Download size={12} />
                                    </button>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === VIEW.POLICIES) {
    const togglePolicyDetail = (id) => {
      setPolicyDetailOpen((curr) => ({
        ...curr,
        [id]: !curr[id],
      }));
    };

    return (
      <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
        <PanelTitle>Company Policies</PanelTitle>
        <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
          <JumpList
            items={POLICIES.map((p) => p.jumpLabel)}
            onJump={(item) => {
              const policy = POLICIES.find((p) => p.jumpLabel === item);
              if (!policy) return;
              jumpToSection(policy.id, () => {
                setPolicyOpen((curr) => ({ ...curr, [policy.id]: true }));
                setPolicyDetailOpen((curr) => ({ ...curr, [policy.id]: true }));
              });
            }}
          />
          <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
            {POLICIES.map((policy) => {
              const sectionOpen = !!policyOpen[policy.id];
              const detailOpen = !!policyDetailOpen[policy.id];
              const fileRow = {
                month: policy.title,
                text: policy.description,
                file: policy.file,
              };

              return (
                <div
                  key={policy.id}
                  id={toJumpId(policy.id)}
                  className="border border-[#dfe5ed] mb-2 bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPolicyOpen((curr) => ({
                        ...curr,
                        [policy.id]: !curr[policy.id],
                      }))
                    }
                    className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left"
                  >
                    <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                      {sectionOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      {policy.title}
                    </h4>
                    <span className="text-[11px] text-[#a4afbf] shrink-0 ml-2">
                      Last updated on {policy.date}
                    </span>
                  </button>

                  {sectionOpen && (
                    <div className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => togglePolicyDetail(policy.id)}
                        className="w-full text-left"
                      >
                        <p className="text-[13px] text-[#556176] font-semibold inline-flex items-center gap-1">
                          {detailOpen ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                          {policy.title}
                        </p>
                        <p className="text-[12px] text-[#9ca8b8] mt-1 ml-4">
                          {policy.description}
                        </p>
                      </button>

                      {detailOpen && (
                        <div className="mt-2 ml-4">
                          <div className="border border-[#dfe5ed] h-8 px-3 text-[12px] inline-flex items-center gap-8 bg-white">
                            <span>{policy.file}</span>
                            <span className="inline-flex gap-2 text-[#8d9aad]">
                              <button
                                type="button"
                                onClick={() => handleViewPayslip(fileRow)}
                                className="hover:text-[#1890ff] p-0.5"
                                aria-label={`View ${policy.file}`}
                                title="View policy"
                              >
                                <Search size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPayslip(fileRow)}
                                className="hover:text-[#1890ff] p-0.5"
                                aria-label={`Download ${policy.file}`}
                                title="Download policy"
                              >
                                <Download size={12} />
                              </button>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === VIEW.FORM16) {
    return (
      <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
        <PanelTitle>Form 16</PanelTitle>
        <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
          <JumpList
            items={FORM16_YEARS}
            onJump={(item) => {
              jumpToSection(item, () =>
                setForm16YearOpen((curr) => ({ ...curr, [item]: true }))
              );
            }}
          />
          <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
            {FORM16_YEARS.map((year) => (
              <div key={year} id={toJumpId(year)} className="border border-[#dfe5ed] mb-2 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setForm16YearOpen((curr) => ({
                      ...curr,
                      [year]: !curr[year],
                    }))
                  }
                  className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left"
                >
                  <span className="text-[16px] font-semibold text-[#59657b] inline-flex items-center gap-1">
                    {form16YearOpen[year] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    FY {year}
                  </span>
                </button>
                {form16YearOpen[year] && (
                  <p className="px-3 py-3 text-[12px] text-[#9ca8b8]">
                    No Form 16 available for this financial year.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === VIEW.FORMS) {
    return (
      <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
        <PanelTitle>Forms</PanelTitle>
        <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
          <JumpList
            items={FORM_SECTIONS.map((s) => s.jumpLabel)}
            onJump={(item) => {
              const section = FORM_SECTIONS.find((s) => s.jumpLabel === item);
              if (!section) return;
              jumpToSection(section.id, () =>
                setFormSectionOpen((curr) => ({ ...curr, [section.id]: true }))
              );
            }}
          />
          <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
            {FORM_SECTIONS.map((section) => (
              <div
                key={section.id}
                id={toJumpId(section.id)}
                className="border border-[#dfe5ed] mb-2 bg-white"
              >
                <button
                  type="button"
                  onClick={() =>
                    setFormSectionOpen((curr) => ({
                      ...curr,
                      [section.id]: !curr[section.id],
                    }))
                  }
                  className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left"
                >
                  <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                    {formSectionOpen[section.id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    {section.title}
                  </h4>
                </button>
                {formSectionOpen[section.id] && (
                  <p className="px-3 py-3 text-[12px] text-[#9ca8b8]">
                    No forms are available in this section yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Letters List</PanelTitle>
      <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
        <JumpList
          items={LETTER_SECTIONS.map((s) => s.jumpLabel)}
          onJump={(item) => {
            const section = LETTER_SECTIONS.find((s) => s.jumpLabel === item);
            if (!section) return;
            jumpToSection(section.id, () =>
              setLetterSectionOpen((curr) => ({ ...curr, [section.id]: true }))
            );
          }}
        />
        <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
          {LETTER_SECTIONS.map((section) => (
            <div
              key={section.id}
              id={toJumpId(section.id)}
              className="border border-[#dfe5ed] mb-2 bg-white"
            >
              <button
                type="button"
                onClick={() =>
                  setLetterSectionOpen((curr) => ({
                    ...curr,
                    [section.id]: !curr[section.id],
                  }))
                }
                className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left"
              >
                <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                  {letterSectionOpen[section.id] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  {section.title}
                </h4>
              </button>
              {letterSectionOpen[section.id] && (
                <div className="px-3 py-6 flex items-center justify-center">
                  <div className="text-center">
                    <EmptyDocIllustration />
                    <p className="text-[16px] text-[#7a8699] mt-2">Sigh! It&apos;s lonely here</p>
                    <p className="text-[12px] text-[#a2adbd] mt-1">No items are available yet!</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DocumentCenter;
