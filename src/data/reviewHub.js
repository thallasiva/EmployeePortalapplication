/** Review hub sidebar navigation and center-panel copy */

export const REVIEW_NAV_SECTIONS = [
  {
    id: "attendance",
    label: "ATTENDANCE",
    items: [
      {
        id: "attendance-regularization",
        label: "Attendance Regularization",
        emptyMessage:
          "Hey, you have no regularization records to view",
        emptyType: "regularization",
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
        emptyMessage: "Hey, you have no request hub records to view",
        emptyType: "generic",
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
        emptyMessage: "Hey, you have no confirmation records to view",
        emptyType: "generic",
      },
      {
        id: "resignations",
        label: "Resignations",
        emptyMessage: "Hey, you have no resignation records to view",
        emptyType: "generic",
      },
      {
        id: "helpdesk",
        label: "Helpdesk",
        emptyMessage: "Hey, you have no helpdesk records to view",
        emptyType: "generic",
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
        emptyMessage: "Hey, you have no leave records to view",
        emptyType: "generic",
      },
      {
        id: "leave-cancel",
        label: "Leave Cancel",
        emptyMessage: "Hey, you have no leave cancel records to view",
        emptyType: "generic",
      },
      {
        id: "leave-comp-off",
        label: "Leave Comp Off",
        emptyMessage: "Hey, you have no comp off records to view",
        emptyType: "generic",
      },
      {
        id: "restricted-holiday",
        label: "Restricted Holiday",
        emptyMessage: "Hey, you have no restricted holiday records to view",
        emptyType: "generic",
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
        emptyMessage: "Hey, you have no letter approval records to view",
        emptyType: "generic",
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
        emptyMessage: "Hey, you have no reimbursement claims to view",
        emptyType: "generic",
      },
    ],
  },
];

export const DEFAULT_REVIEW_ITEM_ID = "attendance-regularization";

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
