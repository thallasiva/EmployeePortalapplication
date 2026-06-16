export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Marketing",
  "Sales",
  "HR",
  "Operations",
  "Finance",
];

export const DEPARTMENT_BADGE = {
  Engineering: "teams-badge--engineering",
  Product: "teams-badge--product",
  Marketing: "teams-badge--marketing",
  Sales: "teams-badge--sales",
  HR: "teams-badge--hr",
  Operations: "teams-badge--operations",
  Finance: "teams-badge--finance",
};

export const INITIAL_TEAMS = [
  {
    id: "platform",
    name: "Platform",
    department: "Engineering",
    description: "Core platform infrastructure and backend services",
    avgTenure: "3.3 yrs",
    lead: { name: "Sarah Chen", title: "VP of Engineering" },
    members: [
      { name: "Sarah Chen", title: "VP of Engineering", isLead: true },
      { name: "Marcus Johnson", title: "Senior Backend Engineer" },
      { name: "Priya Patel", title: "DevOps Engineer" },
    ],
  },
  {
    id: "frontend",
    name: "Frontend",
    department: "Engineering",
    description: "Web and mobile UI development",
    avgTenure: "2.1 yrs",
    lead: { name: "David Park", title: "Frontend Lead" },
    members: [
      { name: "David Park", title: "Frontend Lead", isLead: true },
      { name: "Lisa Anderson", title: "Senior UI Engineer" },
    ],
  },
  {
    id: "product-core",
    name: "Product Core",
    department: "Product",
    description: "Product strategy, roadmap, and feature delivery",
    avgTenure: "2.8 yrs",
    lead: { name: "Jenni Sims", title: "Product Manager" },
    members: [
      { name: "Jenni Sims", title: "Product Manager", isLead: true },
      { name: "Michael Torres", title: "Product Analyst" },
      { name: "Emily Watson", title: "UX Researcher" },
    ],
  },
  {
    id: "growth-marketing",
    name: "Growth Marketing",
    department: "Marketing",
    description: "Demand generation, campaigns, and brand growth",
    avgTenure: "1.9 yrs",
    lead: { name: "Chris Brown", title: "Marketing Lead" },
    members: [
      { name: "Chris Brown", title: "Marketing Lead", isLead: true },
      { name: "Diana Ross", title: "Content Strategist" },
    ],
  },
  {
    id: "enterprise-sales",
    name: "Enterprise Sales",
    department: "Sales",
    description: "Enterprise accounts and revenue partnerships",
    avgTenure: "4.2 yrs",
    lead: { name: "John Gibbs", title: "Sales Director" },
    members: [
      { name: "John Gibbs", title: "Sales Director", isLead: true },
      { name: "Rahul Mehta", title: "Account Executive" },
      { name: "Maria Garcia", title: "Sales Operations" },
      { name: "Tom Harris", title: "Business Development" },
    ],
  },
];
