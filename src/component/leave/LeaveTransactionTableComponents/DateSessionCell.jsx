import React from "react";
function DateSessionCell({
  date,
  session
}) {
  if (!session) {
    return <span>{date}</span>;
  }
  return <div>
      <div>{date}</div>
      <div className="text-[11px] text-[#888] mt-0.5">{session}</div>
    </div>;
}
export { DateSessionCell };
