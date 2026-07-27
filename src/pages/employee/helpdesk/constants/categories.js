import {
  Monitor, Smartphone, HardDrive, Download,
  LogOut, UserPlus, AlertCircle, Wifi, Globe, ShieldCheck, Users,
  Network, Server, Wrench,
} from "lucide-react";

export const CATEGORIES = [
  {
    id: "hardware",
    label: "Hardware and Software",
    topics: [
      { id: "it_help",  Icon: Monitor,     label: "Get IT help",          desc: "Get assistance for general IT problems and questions." },
      { id: "mobile",   Icon: Smartphone,  label: "New mobile device",    desc: "Need a mobile phone or time for replacement? Let us know." },
      { id: "hw_req",   Icon: HardDrive,   label: "Request new hardware", desc: "For example, a new mouse or monitor." },
      { id: "sw_req",   Icon: Download,    label: "Request new software", desc: "If you need a software license, raise a request here." },
    ],
  },
  {
    id: "logins",
    label: "Logins and Accounts",
    topics: [
      { id: "exit",      Icon: LogOut,    label: "Exit Clearance",          desc: "Initiate or follow up on an exit clearance process." },
      { id: "new_acc",   Icon: UserPlus,  label: "Request a new account",   desc: "Need access to a system or application? Raise it here." },
      { id: "fix_acc",   Icon: AlertCircle, label: "Fix an account problem", desc: "Locked out, wrong permissions, or account errors." },
      { id: "wifi",      Icon: Wifi,      label: "Get a guest wifi account", desc: "Request a temporary guest wifi login for a visitor." },
      { id: "vpn",       Icon: Globe,     label: "Set up VPN to the office", desc: "Need VPN access to connect to office systems remotely." },
      { id: "admin_acc", Icon: ShieldCheck, label: "Request admin access",   desc: "Request elevated or administrative system access." },
      { id: "onboard",   Icon: Users,     label: "Onboard new employees",   desc: "Set up accounts and access for a new team member." },
    ],
  },
  {
    id: "servers",
    label: "Servers and Infrastructure",
    topics: [
      { id: "network",   Icon: Network, label: "Report a Network Problem",       desc: "Slow internet, connectivity drops, or network outages." },
      { id: "server",    Icon: Server,  label: "Report a system/server problem", desc: "Server down, service unavailable, or performance issues." },
      { id: "hardware2", Icon: Wrench,  label: "Report broken hardware",         desc: "A device or peripheral is damaged or not working." },
    ],
  },
];

export const URGENCY_OPTIONS = [
  "",
  "Immediately – it's affecting lots of people",
  "High – a workaround exists but isn't ideal",
  "Medium – there's a workaround available",
  "Low – it can wait a little",
];

export const IMPACT_OPTIONS = [
  "",
  "Affecting the whole organisation",
  "Affecting a team or project",
  "Affecting just me",
];

export const SERVICES_OPTIONS = [
  "", "Email", "VPN", "Internet / Wi-Fi", "File Server",
  "Database", "Web Server", "DNS", "Active Directory",
  "Microsoft 365", "Google Workspace", "Other",
];

export const TICKET_STATUSES = ["all", "Open", "Forwarded", "In Progress", "Reopened", "Resolved", "Closed", "Rejected"];
