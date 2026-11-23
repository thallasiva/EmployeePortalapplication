import React from "react";
import { Settings, Shield, FileText, Calendar, Activity } from "lucide-react";
const TABS = [{
  id: "smtp",
  label: "SMTP Settings",
  icon: <Settings size={15} />,
  desc: "Server & auth config"
}, {
  id: "templates",
  label: "Email Templates",
  icon: <FileText size={15} />,
  desc: "Create & manage templates"
}, {
  id: "permissions",
  label: "Permissions",
  icon: <Shield size={15} />,
  desc: "Role-based access"
}, {
  id: "logs",
  label: "Email Logs",
  icon: <Activity size={15} />,
  desc: "Track sent emails"
}, {
  id: "scheduled",
  label: "Scheduled Emails",
  icon: <Calendar size={15} />,
  desc: "Recurring sends"
}];
export { TABS };
