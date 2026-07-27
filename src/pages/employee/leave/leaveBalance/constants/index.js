import {
  CalendarHeart, Briefcase, Clock3, Moon, Gift, Flag,
} from "lucide-react";

export const TYPE_CONFIG = [
  {
    match: ["earned", "el", "annual"],
    icon: CalendarHeart,
    bg: "#E6F1FB", iconColor: "#185FA5", barColor: "#378ADD",
    badgeBg: "#E6F1FB", badgeColor: "#185FA5", detailColor: "#185FA5",
  },
  {
    match: ["sick", "sl", "medical"],
    icon: Moon,
    bg: "#FAEEDA", iconColor: "#854F0B", barColor: "#EF9F27",
    badgeBg: "#FAEEDA", badgeColor: "#854F0B", detailColor: "#854F0B",
  },
  {
    match: ["compensatory", "comp", "co"],
    icon: Clock3,
    bg: "#EEEDFE", iconColor: "#534AB7", barColor: "#7F77DD",
    badgeBg: "#EEEDFE", badgeColor: "#534AB7", detailColor: "#534AB7",
  },
  {
    match: ["work from home", "wfh", "remote"],
    icon: Briefcase,
    bg: "#E1F5EE", iconColor: "#0F6E56", barColor: "#1D9E75",
    badgeBg: "#E1F5EE", badgeColor: "#0F6E56", detailColor: "#0F6E56",
  },
  {
    match: ["without pay", "lwp", "unpaid"],
    icon: Gift,
    bg: "#FCEBEB", iconColor: "#A32D2D", barColor: "#E24B4A",
    badgeBg: "#FCEBEB", badgeColor: "#A32D2D", detailColor: "#A32D2D",
  },
  {
    match: ["restricted", "rh", "optional"],
    icon: Flag,
    bg: "#FBEAF0", iconColor: "#993556", barColor: "#D4537E",
    badgeBg: "#FBEAF0", badgeColor: "#993556", detailColor: "#993556",
  },
  {
    match: [],
    icon: CalendarHeart,
    bg: "#F0F4FF", iconColor: "#3B5FC0", barColor: "#5579DB",
    badgeBg: "#F0F4FF", badgeColor: "#3B5FC0", detailColor: "#3B5FC0",
  },
];
