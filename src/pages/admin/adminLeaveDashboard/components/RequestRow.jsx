import React from 'react';

const RequestRow = React.memo(function RequestRow({
  row,
  showActions,
  onApprove,
  onReject,
  highlight,
}) {
  return (
    <div
      id={`leave-request-${row.id}`}
      className={`border rounded-lg p-3 mb-2 hover:bg-gray-50/80 bg-white ${
        highlight ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-100'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{row.employee}</p>
          <p className="text-xs text-gray-500">{row.department}</p>
        </div>
        <span
          className={`admin-status-badge ${
            row.status === 'Approved'
              ? 'approved'
              : row.status === 'Rejected'
              ? 'rejected'
              : 'pending'
          }`}
        >
          {row.status}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
        <span><strong>Type:</strong> {row.type}</span>
        <span><strong>Days:</strong> {row.days}</span>
        <span><strong>From:</strong> {row.from}</span>
        <span><strong>To:</strong> {row.to}</span>
        <span className="sm:col-span-2"><strong>Reason:</strong> {row.reason}</span>
        <span><strong>Applied:</strong> {row.appliedOn}</span>
        {row.actionBy && (
          <span><strong>Action:</strong> {row.actionBy} on {row.actionOn}</span>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => onApprove(row.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(row.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
});

export default RequestRow;
