import {
  CalendarHeart, Briefcase, Clock3, Moon, Gift, Flag,
} from "lucide-react";
export const TYPE_CONFIG = [
  {
    match: ["earned", "el", "annual"],
    icon: CalendarHeart,
    bg: "#E6F1FB", iconColor: "#cf6900", barColor: "#e87500",
    badgeBg: "#E6F1FB", badgeColor: "#cf6900", detailColor: "#cf6900",
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
    bg: "#EEEDFE", iconColor: "#cf6900", barColor: "#7F77DD",
    badgeBg: "#EEEDFE", badgeColor: "#cf6900", detailColor: "#cf6900",
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
    bg: "#fff7ed", iconColor: "#e87500", barColor: "#e87500",
    badgeBg: "#fff7ed", badgeColor: "#e87500", detailColor: "#e87500",
  },
];
