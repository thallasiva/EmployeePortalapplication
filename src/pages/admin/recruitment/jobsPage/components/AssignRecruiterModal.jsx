import React from "react";
import { Loader2 } from "lucide-react";
import { Modal, Btn } from "../shared";

function AssignRecruiterModal({
  assignOpen,
  onClose,
  recruiters,
  assignIds,
  setAssignIds,
  originalIds,
  assigning,
  loadingAssign,
  handleAssign,
}) {
  return (
    <Modal
      open={!!assignOpen}
      onClose={onClose}
      title={`Assign Recruiter — ${assignOpen?.title || ""}`}
      width={420}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={handleAssign} disabled={assigning}>
            {assigning ? "Saving…" : "Confirm Assignment"}
          </Btn>
        </>
      }
    >
      {assignOpen && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Select recruiters for <strong>{assignOpen.client}</strong> —{" "}
            <strong>{assignOpen.title}</strong>.
          </p>
          {loadingAssign ? (
            <div className="flex justify-center py-6 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <>
              {recruiters.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No recruiters found</p>
              )}
              {recruiters.map((r) => {
                const empId = r.employee_id;
                const name = `${r.first_name || ""} ${r.last_name || ""}`.trim();
                const isChecked = assignIds.includes(empId);
                const isOriginal = originalIds.includes(empId);
                return (
                  <label
                    key={empId}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-2 cursor-pointer border transition-colors ${
                      isChecked ? "border-[#f18200] bg-amber-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setAssignIds((ids) =>
                          e.target.checked ? [...ids, empId] : ids.filter((i) => i !== empId)
                        )
                      }
                      className="accent-[#f18200]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{name}</div>
                      <div className="text-[11px] text-gray-500">{r.email}</div>
                    </div>
                    {isOriginal && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${
                          isChecked
                            ? "bg-yellow-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isChecked ? "Assigned" : "Removed"}
                      </span>
                    )}
                  </label>
                );
              })}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

export default React.memo(AssignRecruiterModal);
