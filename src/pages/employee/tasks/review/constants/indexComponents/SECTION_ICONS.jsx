import React from "react";
import { Clock, Settings, Briefcase, Calendar, MailOpen, DollarSign } from "lucide-react";
const SECTION_ICONS = {
  attendance: <Clock size={12} />,
  "custom-workflows": <Settings size={12} />,
  empinfo: <Briefcase size={12} />,
  leave: <Calendar size={12} />,
  letter: <MailOpen size={12} />,
  payroll: <DollarSign size={12} />
};
export { SECTION_ICONS };
