/** Review hub sidebar navigation and center-panel copy */

export const REVIEW_NAV_SECTIONS = [
  {
    id: "attendance",
    label: "ATTENDANCE",
    items: [
      {
        id: "attendance-regularization",
        label: "Attendance Regularization",
        dataType: "regularization",
      },
    ],
  },
  {
    id: "custom-workflows",
    label: "CUSTOM WORKFLOWS",
    items: [
      {
        id: "request-hub",
        label: "Request Hub",
        dataType: "coming-soon",
      },
    ],
  },
  {
    id: "empinfo",
    label: "EMPINFO",
    items: [
      {
        id: "confirmation",
        label: "Confirmation",
        dataType: "coming-soon",
      },
      {
        id: "resignations",
        label: "Resignations",
        dataType: "resignations",
      },
      {
        id: "helpdesk",
        label: "Helpdesk",
        dataType: "helpdesk",
      },
    ],
  },
  {
    id: "leave",
    label: "LEAVE",
    items: [
      {
        id: "leave",
        label: "Leave",
        dataType: "leave-decisions",
      },
      {
        id: "leave-cancel",
        label: "Leave Cancel",
        dataType: "leave-cancel",
      },
      {
        id: "leave-comp-off",
        label: "Leave Comp Off",
        dataType: "coming-soon",
      },
      {
        id: "restricted-holiday",
        label: "Restricted Holiday",
        dataType: "coming-soon",
      },
    ],
  },
  {
    id: "letter",
    label: "LETTER",
    items: [
      {
        id: "letter-signature",
        label: "Letter Signature Approval",
        dataType: "coming-soon",
      },
    ],
  },
  {
    id: "payroll",
    label: "PAYROLL",
    items: [
      {
        id: "reimbursement-claim",
        label: "Reimbursement Claim",
        dataType: "coming-soon",
      },
    ],
  },
];

export const DEFAULT_REVIEW_ITEM_ID = "leave";

export function findReviewNavItem(itemId) {
  for (const section of REVIEW_NAV_SECTIONS) {
    const item = section.items.find((i) => i.id === itemId);
    if (item) return { ...item, sectionLabel: section.label };
  }
  return null;
}

export function getAllReviewItems() {
  return REVIEW_NAV_SECTIONS.flatMap((s) => s.items);
}
