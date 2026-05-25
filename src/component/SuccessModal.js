import React from "react";

const SuccessModal = ({
  isOpen,
  title = "Success",
  message = "Created successfully.",
  okLabel = "OK",
  onConfirm,
  onClose,
  eventName = "successModalOk",
  eventDetail = {},
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (typeof onConfirm === "function") {
      onConfirm();
    }

    const event = new CustomEvent(eventName, {
      detail: eventDetail,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand"
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
