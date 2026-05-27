/** Leave detail page data — matches Sick Leave dashboard screenshot */

export const LEAVE_DETAIL_CONFIG = {
  "Sick Leave": {
    summary: {
      availableBalance: 4,
      openingBalance: 0,
      granted: 6,
      availed: 2,
    },
    chart: {
      balance: [5, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0],
      consumed: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tooltips: {
        3: { openingBalance: 4, granted: 0 },
      },
    },
    transactions: [
      {
        type: "Availed",
        postedOn: "04 Feb 2026",
        fromDate: "04 Feb 2026",
        fromSession: "Session 1",
        toDate: "04 Feb 2026",
        toSession: "Session 2",
        days: 1,
        reason: "fever",
        remarks: "",
        expiryDate: "-",
      },
      {
        type: "Availed",
        postedOn: "21 Jan 2026",
        fromDate: "16 Jan 2026",
        fromSession: "Session 1",
        toDate: "16 Jan 2026",
        toSession: "Session 2",
        days: 1,
        reason: "Back pain",
        remarks: "",
        expiryDate: "-",
      },
      {
        type: "Granted",
        postedOn: "02 Jan 2026",
        fromDate: "01 Jan 2026",
        fromSession: null,
        toDate: "31 Dec 2026",
        toSession: null,
        days: 6,
        reason: "Annual grant for the period 01 Jan 2026 to 31 Dec 2026",
        remarks: "",
        expiryDate: "-",
      },
    ],
  },
  "Compensatory Off": {
    summary: {
      availableBalance: 1,
      openingBalance: 0,
      granted: 5,
      availed: 4,
    },
    chart: {
      balance: [5, 4, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0],
      consumed: [0, 0, 0, 1, 1, 2, 0, 0, 0, 0, 0, 0],
      tooltips: {},
    },
    transactions: [
      {
        type: "Availed",
        postedOn: "12 May 2026",
        fromDate: "12 May 2026",
        fromSession: "Session 1",
        toDate: "12 May 2026",
        toSession: "Session 2",
        days: 1,
        reason: "Client demo",
        remarks: "",
        expiryDate: "-",
      },
      {
        type: "Availed",
        postedOn: "05 Apr 2026",
        fromDate: "05 Apr 2026",
        fromSession: "Session 1",
        toDate: "05 Apr 2026",
        toSession: "Session 2",
        days: 1,
        reason: "Weekend work",
        remarks: "",
        expiryDate: "-",
      },
      {
        type: "Granted",
        postedOn: "02 Jan 2026",
        fromDate: "01 Jan 2026",
        fromSession: null,
        toDate: "31 Dec 2026",
        toSession: null,
        days: 5,
        reason: "Annual comp off grant for 2026",
        remarks: "",
        expiryDate: "-",
      },
    ],
  },
};

const DEFAULT_SUMMARY = {
  availableBalance: 0,
  openingBalance: 0,
  granted: 0,
  availed: 0,
};

const EMPTY_CHART = {
  balance: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  consumed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  tooltips: {},
};

export function getLeaveDetailConfig(leaveType) {
  return (
    LEAVE_DETAIL_CONFIG[leaveType] ?? {
      summary: DEFAULT_SUMMARY,
      chart: EMPTY_CHART,
      transactions: [],
    }
  );
}
