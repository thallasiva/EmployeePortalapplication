function fmt(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
const STATUS = {
  pending: {
    cls: "bg-gray-100 text-gray-600",
    label: "Not Submitted"
  },
  submitted: {
    cls: "bg-amber-100 text-amber-700",
    label: "Submitted"
  },
  pending_verification: {
    cls: "bg-orange-100 text-orange-700",
    label: "Pending Review"
  },
  approved: {
    cls: "bg-emerald-100 text-emerald-700",
    label: "Approved"
  },
  changes_requested: {
    cls: "bg-red-100 text-red-700",
    label: "Changes Requested"
  },
  rejected: {
    cls: "bg-red-100 text-red-700",
    label: "Rejected"
  }
};
const FILTERS = [{
  key: "pending_verification",
  label: "Pending Review"
}, {
  key: "submitted",
  label: "Submitted"
}, {
  key: "changes_requested",
  label: "Changes Requested"
}, {
  key: "approved",
  label: "Approved"
}, {
  key: "rejected",
  label: "Rejected"
}, {
  key: "pending",
  label: "Not Submitted"
}, {
  key: "all",
  label: "All"
}];
export { fmt, STATUS, FILTERS };
