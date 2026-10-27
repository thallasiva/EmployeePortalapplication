import { Star, CircleCheck, CircleDot, CircleX } from "lucide-react";
export const REC_CLS = {
  "Highly Suitable": { bg: "bg-[#fff7ed]", text: "text-[#f18200]", icon: <Star size={12} /> },
  "Suitable": { bg: "bg-blue-100", text: "text-blue-800", icon: <CircleCheck size={12} /> },
  "Partially Suitable": { bg: "bg-amber-100", text: "text-amber-900", icon: <CircleDot size={12} /> },
  "Not Suitable": { bg: "bg-red-100", text: "text-red-900", icon: <CircleX size={12} /> },
};
