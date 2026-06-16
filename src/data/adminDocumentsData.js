export const DOCUMENT_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "policies", label: "Policies" },
  { id: "handbooks", label: "Handbooks" },
  { id: "templates", label: "Templates" },
  { id: "forms", label: "Forms" },
];

export const INITIAL_ADMIN_DOCUMENTS = [
  {
    id: "doc-1",
    title: "Q1 2026 All-Hands Slides",
    description: "Company-wide presentation for Q1 all-hands meeting.",
    category: "templates",
    fileType: "PPTX",
    size: "4.2 MB",
    author: "Sarah Chen",
    date: "May 20, 2026",
    icon: "slides",
    recent: true,
  },
  {
    id: "doc-2",
    title: "Remote Work Policy",
    description: "Guidelines for remote and hybrid work arrangements.",
    category: "policies",
    fileType: "PDF",
    size: "340 KB",
    author: "Nathan Cooper",
    date: "Jan 12, 2026",
    icon: "pdf",
    recent: true,
  },
  {
    id: "doc-3",
    title: "Onboarding Checklist",
    description: "New hire onboarding tasks and timeline template.",
    category: "templates",
    fileType: "XLSX",
    size: "128 KB",
    author: "Priya Sharma",
    date: "Feb 3, 2026",
    icon: "sheet",
    recent: true,
  },
  {
    id: "doc-4",
    title: "Leave Request Form",
    description: "Standard form for submitting leave requests.",
    category: "forms",
    fileType: "PDF",
    size: "95 KB",
    author: "HR Team",
    date: "Mar 1, 2026",
    icon: "pdf",
    recent: true,
  },
  {
    id: "doc-5",
    title: "Brand Style Guide",
    description: "Visual identity, logos, and typography standards.",
    category: "handbooks",
    fileType: "PDF",
    size: "1.8 MB",
    author: "Design Team",
    date: "Apr 8, 2026",
    icon: "pdf",
    recent: true,
  },
  {
    id: "doc-6",
    title: "Employee Handbook 2026",
    description: "Complete guide to company policies, culture, and benefits.",
    category: "handbooks",
    fileType: "PDF",
    size: "2.4 MB",
    author: "Nathan Cooper",
    date: "Jan 5, 2026",
    icon: "pdf",
    recent: false,
  },
  {
    id: "doc-7",
    title: "PTO Policy",
    description: "Paid time off accrual, usage, and approval process.",
    category: "policies",
    fileType: "PDF",
    size: "210 KB",
    author: "Nathan Cooper",
    date: "Jan 5, 2026",
    icon: "pdf",
    recent: false,
  },
  {
    id: "doc-8",
    title: "Benefits Guide 2026",
    description: "Health, dental, vision, and retirement plan overview.",
    category: "handbooks",
    fileType: "PDF",
    size: "1.1 MB",
    author: "Nathan Cooper",
    date: "Jan 5, 2026",
    icon: "pdf",
    recent: false,
  },
  {
    id: "doc-9",
    title: "Expense Reimbursement Form",
    description: "Form for submitting business expense reimbursements.",
    category: "forms",
    fileType: "PDF",
    size: "78 KB",
    author: "Finance Team",
    date: "Feb 14, 2026",
    icon: "pdf",
    recent: false,
  },
  {
    id: "doc-10",
    title: "Performance Review Template",
    description: "Annual performance review document template.",
    category: "templates",
    fileType: "DOCX",
    size: "156 KB",
    author: "HR Team",
    date: "Mar 22, 2026",
    icon: "doc",
    recent: false,
  },
];

let documentStore = [...INITIAL_ADMIN_DOCUMENTS];

export function getAdminDocuments() {
  return documentStore;
}

export function getRecentDocuments(limit = 5) {
  return documentStore.filter((d) => d.recent).slice(0, limit);
}

export function addAdminDocument(payload) {
  const newDoc = {
    id: `doc-${Date.now()}`,
    title: payload.title,
    description: payload.description || "",
    category: payload.category || "policies",
    fileType: payload.fileType || "PDF",
    size: payload.size || "—",
    author: payload.author || "Admin User",
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    icon: payload.icon || "pdf",
    recent: true,
  };
  documentStore = [newDoc, ...documentStore.map((d) => ({ ...d, recent: d.recent }))];
  return newDoc;
}
