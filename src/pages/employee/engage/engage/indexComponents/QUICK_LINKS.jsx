import React from "react";
import { TreePalm, ClipboardList, CalendarDays, Headphones } from "lucide-react";
const QUICK_LINKS = [{
  label: "Apply Leave",
  path: "/employee/leave/apply",
  emoji: <TreePalm size={14} />
}, {
  label: "Leave Balance",
  path: "/employee/leave/balance",
  emoji: <ClipboardList size={14} />
}, {
  label: "Holiday Calendar",
  path: "/employee/leave/calendar",
  emoji: <CalendarDays size={14} />
}, {
  label: "Helpdesk",
  path: "/employee/worklife/helpdesk",
  emoji: <Headphones size={14} />
}];
export { QUICK_LINKS };
