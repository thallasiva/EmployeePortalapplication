import React from "react";
import { ArrowRight } from "lucide-react";
import { timeAgo } from "./shared";
import { Avatar } from "./Avatar";
import { CategoryBadge } from "./CategoryBadge";
const KudosItem = ({
  k,
  perspective = "wall"
}) => {
  const person = perspective === "received" ? k.from_name : perspective === "sent" ? k.to_name : k.from_name;
  return <article className="flex items-start gap-4 border border-slate-100 rounded-xl p-4 hover:bg-slate-50/60 transition-colors">
      <Avatar name={person} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {perspective === "received" && <><span className="text-sm font-bold  text-[#e87500]">{k.from_name}</span><span className="text-xs text-slate-500">recognised you</span></>}
          {perspective === "sent" && <><span className="text-xs text-slate-500">You recognised</span><span className="text-sm font-bold  text-[#e87500]">{k.to_name}</span></>}
          {perspective === "wall" && <><span className="text-sm font-bold  text-[#e87500]">{k.from_name}</span><ArrowRight size={13} className="text-slate-400" /><span className="text-sm font-bold  text-[#e87500]">{k.to_name}</span></>}
          <CategoryBadge name={k.category_name} color={k.category_color} />
          {!k.is_public && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Private</span>}
        </div>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line break-words">{k.message}</p>
        <p className="text-xs text-slate-400 mt-2">{timeAgo(k.created_at)}</p>
      </div>
    </article>;
};
export { KudosItem };
