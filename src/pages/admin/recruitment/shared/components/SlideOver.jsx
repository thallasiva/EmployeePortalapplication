import React from "react";
import { X } from "lucide-react";

export const SlideOver = React.memo(function SlideOver({ open, onClose, title, children, width = 520, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex">
      <div className="flex-1 bg-black/35" onClick={onClose} />
      <div
        className="bg-white flex flex-col h-screen shadow-[-8px_0_40px_rgba(0,0,0,0.15)] max-w-[95vw]"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-gray-100 bg-white">
          <h2 className="m-0 text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-gray-400 p-1 rounded-md flex">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[22px] py-5">{children}</div>
        {footer && (
          <div className="px-[22px] py-3.5 border-t border-gray-100 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});
