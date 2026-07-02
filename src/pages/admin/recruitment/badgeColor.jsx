export const badgeColor = (value) => {
  if (
    [
      "Active",
      "Selected",
      "Shortlisted",
      "Onboarded",
      "Completed",
      "Closed",
      "Approved",
      "Accepted",
      "Present",
      "Paid",
    ].includes(value)
  ) {
    return "green";
  }

  if (
    [
      "Hold",
      "Review",
      "In Progress",
      "Work in Progress",
      "Pending",
      "Pending Approval",
      "Interview Scheduled",
      "Under Review",
    ].includes(value)
  ) {
    return "orange";
  }

  if (
    [
      "Inactive",
      "Rejected",
      "Not Selected",
      "Cancelled",
      "Declined",
      "Absent",
      "Failed",
    ].includes(value)
  ) {
    return "red";
  }

  return "blue";
};

