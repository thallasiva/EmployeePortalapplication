import React from "react";
import { ArrowRight } from "lucide-react";
import { Avatar, TYPE_STYLE, timeAgo } from ".././kudosFeedbackShared";
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)

const FeedbackItem = ({
  f,
  perspective
}) => {
  const person = perspective === "sent" ? f.to_name : f.from_name;
  const role = perspective === "sent" ? f.to_designation : f.from_is_manager ? "Your manager" : f.from_designation;
  return <article className="flex gap-4 py-4 border-b border-slate-50 last:border-0">
      <Avatar name={person} size={42} tone="slate" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            {perspective === "sent" && <span className="text-slate-500">To </span>}
            {perspective === "team" ? <><strong className=" text-[#e87500]">{f.from_name}</strong><ArrowRight size={13} className="inline mx-1 text-slate-400" /><strong className=" text-[#e87500]">{f.to_name}</strong></> : <strong className=" text-[#e87500]">{person}</strong>}
            {perspective !== "team" && role && <span className="text-slate-500"> · {role}</span>}
          </p>
          <div className="flex items-center gap-1.5">
            {f.is_anonymous && f.from_name !== "Anonymous" ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Anonymous</span> : null}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLE[f.feedback_type].badge}`}>{f.feedback_type}</span>
          </div>
        </div>
        {(f.request_topic || f.category_name) && <p className="text-xs text-slate-500 mt-1">
            {f.request_topic ? `Requested: ${f.request_topic}` : ""}
            {f.request_topic && f.category_name ? " · " : ""}
            {f.category_name || ""}
          </p>}
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line break-words">{f.message}</p>
        <p className="text-xs text-slate-400 mt-2">{timeAgo(f.created_at)}</p>
      </div>
    </article>;
};
export { FeedbackItem };
