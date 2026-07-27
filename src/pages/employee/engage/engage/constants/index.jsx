import React from "react";
import { Radio, Megaphone, BookOpen, Star, PartyPopper, Info, AlertCircle, CheckCircle2, Calendar } from "lucide-react";

export const AVATAR_COLORS = [
  ["#E6F1FB", "#185FA5"],
  ["#FAEEDA", "#854F0B"],
  ["#EEEDFE", "#534AB7"],
  ["#E1F5EE", "#0F6E56"],
  ["#FBEAF0", "#993556"],
  ["#FFF3E0", "#8B5E04"],
];

export const SECTIONS = [
  { key: "all",          label: "All Activities",  icon: <Radio size={16} />,       color: "#6b7a8d" },
  { key: "announcement", label: "Announcements",   icon: <Megaphone size={16} />,   color: "#185FA5", bg: "#E6F1FB" },
  { key: "holiday",      label: "Holidays",        icon: <BookOpen size={16} />,    color: "#534AB7", bg: "#EEEDFE" },
  { key: "recognition",  label: "Recognition",     icon: <Star size={16} />,        color: "#854F0B", bg: "#FAEEDA" },
  { key: "event",        label: "Events",          icon: <PartyPopper size={16} />, color: "#0F6E56", bg: "#E1F5EE" },
  { key: "helpdesk",     label: "Helpdesk",        icon: <Info size={16} />,        color: "#7a1e1e", bg: "#FDEDED" },
];

export const STATUS_CFG = {
  new:        { label: "New",        bg: "#E6F1FB", color: "#185FA5", Icon: AlertCircle },
  open:       { label: "Open",       bg: "#FAEEDA", color: "#854F0B", Icon: AlertCircle },
  resolved:   { label: "Resolved",   bg: "#E1F5EE", color: "#0F6E56", Icon: CheckCircle2 },
  upcoming:   { label: "Upcoming",   bg: "#EEEDFE", color: "#534AB7", Icon: Calendar },
  general:    { label: "General",    bg: "#EEEDFE", color: "#534AB7", Icon: Calendar },
  restricted: { label: "Restricted", bg: "#FBEAF0", color: "#993556", Icon: Calendar },
  kudos:      { label: "Kudos",      bg: "#FAEEDA", color: "#854F0B", Icon: Star },
};
