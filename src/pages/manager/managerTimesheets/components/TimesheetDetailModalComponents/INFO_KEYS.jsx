import React from "react";
import StatusBadge from ".././StatusBadge";
import { formatHours, formatDate } from "../../utils";
const INFO_KEYS = [["Employee", d => d.employee_name], ["Week", d => `${d.week_start} – ${d.week_end}`], ["Total Hours", d => formatHours(d.total_hours)], ["Status", d => <StatusBadge key="s" status={d.status} />], ["Submitted", d => formatDate(d.submitted_at)], ["Reviewed By", d => d.reviewer_name || "—"], ["Reviewed At", d => formatDate(d.reviewed_at)], ["Manager Comment", d => d.comments || "—"]];
export { INFO_KEYS };
