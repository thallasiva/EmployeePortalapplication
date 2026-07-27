import React from "react";
import { X } from "lucide-react";

export const Modal = React.memo(function Modal({ open, onClose, title, children, width = 560, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/45 flex items-center justify-center p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[14px] w-full flex flex-col max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-gray-100">
          <h2 className="m-0 text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-gray-400 p-1 rounded-md flex">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-[22px] py-5 flex-1">{children}</div>
        {footer && (
          <div className="px-[22px] py-3.5 border-t border-gray-100 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});
