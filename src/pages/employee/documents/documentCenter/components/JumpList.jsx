import React from "react";

const JumpList = React.memo(function JumpList({ title = "JUMP TO", items, onJump }) {
  return (
    <aside className="w-[170px] border-r border-[#edf1f5] px-3 py-3 shrink-0">
      <p className="text-[11px] text-[#a3afbf] mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onJump?.(item)}
            className="block text-[13px] text-[#5b6778] hover:text-[#1890ff] text-left">
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
});

export default JumpList;
