import React from "react";

const ChangeAssignmentModal = ({
  isOpen,
  title,
  mode = "select",
  value,
  options = [],
  placeholder,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 pt-6">
      <div className="w-full max-w-3xl rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <h2 className="text-[22px] font-semibold text-slate-800">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded border border-red-400 text-xs font-semibold text-red-500"
          >
            X
          </button>
        </div>

        <div className="px-5 py-8">
          {mode === "select" ? (
            <select
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-14 w-full rounded border border-slate-200 px-6 text-base text-slate-700 outline-none"
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              className="h-14 w-full rounded border border-slate-200 px-4 text-base text-slate-700 outline-none"
            />
          )}

          <div className="mt-8 flex flex-wrap gap-5">
            <button
              type="button"
              onClick={onSubmit}
              className="min-w-40 rounded-xl bg-orange-500 px-12 py-3 text-[18px] font-medium text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
            >
              Add
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-w-40 rounded-xl bg-rose-600 px-12 py-3 text-[18px] font-medium text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeAssignmentModal;
