import { Sparkles } from "lucide-react";
export function AutoHint({
  field,
  autoFilled
}) {
  if (!autoFilled.includes(field)) return null;
  return <div className="text-[10px] text-[#e87500] mt-0.5 font-semibold inline-flex items-center gap-1"><Sparkles size={10} /> extracted from resume</div>;
}
