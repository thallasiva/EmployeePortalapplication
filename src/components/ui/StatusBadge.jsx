import { memo } from "react";
import Badge from "./Badge";

/**
 * Maps status strings to badge colors.
 * Add new statuses here — no changes needed in consuming components.
 */
const STATUS_COLOR_MAP = {
  /* ── positive ── */
  active: "green", approved: "green", present: "green", completed: "green",
  success: "green", verified: "green", accepted: "green", "full day": "green",
  joined: "green", onboarded: "green",

  /* ── negative ── */
  inactive: "red", rejected: "red", absent: "red", failed: "red",
  terminated: "red", declined: "red", expired: "red", cancelled: "red",
  deactivated: "red",

  /* ── warning / neutral-pending ── */
  pending: "yellow", "on leave": "yellow", "in review": "yellow",
  submitted: "yellow", "half day": "yellow", "short leave": "yellow",
  "pending approval": "yellow", "changes requested": "yellow",
  "pending verification": "yellow",

  /* ── info / draft ── */
  draft: "gray", closed: "gray", "not submitted": "gray",
  "not started": "gray", on_hold: "gray",

  /* ── processing ── */
  processing: "blue", "in progress": "blue", reviewing: "blue",
  regularized: "blue", "under review": "blue",

  /* ── offer / recruitment ── */
  offered: "orange", shortlisted: "orange", "offer accepted": "teal",
  "offer rejected": "red", interview: "purple", screening: "purple",
  hired: "teal",
};

export function getStatusColor(status)
{
  return STATUS_COLOR_MAP[status?.toLowerCase()] ?? "gray";
}

/**
 * Drop-in replacement for any inline status pill.
 * @param {string} status — raw status string, e.g. "approved", "pending"
 */
const StatusBadge = memo(function StatusBadge({ status })
{
  if (!status) return null;
  return <Badge color={getStatusColor(status)}>{status}</Badge>;
});

export default StatusBadge;
