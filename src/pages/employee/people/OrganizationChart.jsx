import React, { useState } from "react";
import { Search, ZoomIn, ZoomOut, RotateCcw, Network } from "lucide-react";
import { getUserInitials } from "../../../lib/dateUtils";
import "./orgChart.css";

/** Departments shown in the legend, with colors used across the org tree badges. */
const DEPARTMENTS = [
  { key: "engineering", label: "Engineering", color: "#6366f1" },
  { key: "product", label: "Product", color: "#a855f7" },
  { key: "design", label: "Design", color: "#ec4899" },
  { key: "marketing", label: "Marketing", color: "#f97316" },
  { key: "sales", label: "Sales", color: "#10b981" },
  { key: "hr", label: "HR", color: "#ef4444" },
  { key: "finance", label: "Finance", color: "#3b82f6" },
  { key: "operations", label: "Operations", color: "#84cc16" },
];

const DEPT_COLOR = DEPARTMENTS.reduce((acc, d) => {
  acc[d.key] = d.color;
  return acc;
}, {});

const DEPT_LABEL = DEPARTMENTS.reduce((acc, d) => {
  acc[d.key] = d.label;
  return acc;
}, {});

/** Sample hierarchy matching the org chart mockup. */
const ORG_TREE = {
  name: "Sarah Chen",
  title: "VP of Engineering",
  department: "engineering",
  children: [
    { name: "Marcus Johnson", title: "Senior Backend Engineer", department: "engineering" },
    { name: "Priya Patel", title: "DevOps Engineer", department: "engineering" },
    {
      name: "Aisha Rahman",
      title: "Senior Frontend Engineer",
      department: "engineering",
      children: [
        { name: "Daniel Kim", title: "Full-Stack Engineer", department: "engineering" },
        { name: "Kevin Zhao", title: "Junior Frontend Engineer", department: "engineering" },
      ],
    },
    {
      name: "James Williams",
      title: "Head of Product",
      department: "product",
      children: [
        { name: "Ryan O'Brien", title: "Product Manager", department: "product" },
        { name: "Amanda Wright", title: "Product Analyst", department: "product" },
      ],
    },
  ],
};

function OrgCard({ node, matched }) {
  const color = DEPT_COLOR[node.department] || "#94a3b8";
  return (
    <div className={`org-card ${matched ? "org-card--highlight" : ""}`}>
      <div className="org-avatar" style={{ backgroundColor: `${color}1a`, color }}>
        {getUserInitials(node.name)}
      </div>
      <p className="org-name">{node.name}</p>
      <p className="org-title">{node.title}</p>
      <span className="org-badge" style={{ backgroundColor: `${color}1a`, color }}>
        {DEPT_LABEL[node.department] || node.department}
      </span>
    </div>
  );
}

function OrgNode({ node, search }) {
  const matched =
    !!search && node.name.toLowerCase().includes(search.trim().toLowerCase());

  return (
    <li>
      <OrgCard node={node} matched={matched} />
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgNode key={child.name} node={child} search={search} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrganizationChart() {
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(100);

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <Network size={22} className="text-[#2ea7ff]" />
          <div>
            <h1 className="text-[22px] font-semibold text-[#1f2937]">Organization Chart</h1>
            <p className="text-sm text-[#64748b]">Visual hierarchy of your organization.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="h-[38px] w-[220px] pl-9 pr-3 rounded-lg border border-[#dbe2ea] bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#dbe2ea] rounded-lg h-[38px] px-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 text-[#64748b] hover:text-[#1f2937] rounded"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium text-[#475569] w-10 text-center select-none">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1.5 text-[#64748b] hover:text-[#1f2937] rounded"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1.5 text-[#64748b] hover:text-[#1f2937] rounded border-l border-[#e2e8f0] ml-1"
              aria-label="Reset zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4 mb-5">
        {DEPARTMENTS.map((d) => (
          <span key={d.key} className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
          </span>
        ))}
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-auto p-8">
        <div
          className="org-tree"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
        >
          <ul>
            <OrgNode node={ORG_TREE} search={search} />
          </ul>
        </div>
      </div>
    </div>
  );
}
