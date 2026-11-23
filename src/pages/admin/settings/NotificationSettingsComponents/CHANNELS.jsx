import React from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
const CHANNELS = [{
  key: "email",
  label: "Email",
  icon: <Mail size={16} />,
  color: "#e87500"
}, {
  key: "inapp",
  label: "In-App",
  icon: <Bell size={16} />,
  color: "#e87500"
}, {
  key: "sms",
  label: "SMS",
  icon: <Smartphone size={16} />,
  color: "#10b981"
}, {
  key: "push",
  label: "Push",
  icon: <MessageSquare size={16} />,
  color: "#e87500"
}];
export { CHANNELS };
