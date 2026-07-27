import React from 'react';
import { Users } from 'lucide-react';
import RequestRow from './RequestRow';

const RequestsPanel = React.memo(function RequestsPanel({
  panelRef,
  requestTab,
  onTabChange,
  pending,
  approved,
  rejected,
  tabRows,
  loading,
  highlightRequestId,
  onApprove,
  onReject,
}) {
  return (
    <div ref={panelRef} className="admin-dash-card flex flex-col min-h-[420px]">
      <div className="flex items-center gap-2 mb-1">
        <Users size={18} className="text-gray-600" />
        <h3 className="font-semibold text-gray-900">Employee Requests</h3>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 mt-2">
        <button
          type="button"
          className={`admin-tab-btn ${requestTab === 'pending' ? 'active' : ''}`}
          onClick={() => onTabChange('pending')}
        >
          Pending ({pending.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${requestTab === 'approved' ? 'active' : ''}`}
          onClick={() => onTabChange('approved')}
        >
          Completed ({approved.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${requestTab === 'rejected' ? 'active' : ''}`}
          onClick={() => onTabChange('rejected')}
        >
          Rejected ({rejected.length})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading requests...</p>
        ) : tabRows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No {requestTab} requests.
          </p>
        ) : (
          tabRows.map((row) => (
            <RequestRow
              key={row.id}
              row={row}
              showActions={requestTab === 'pending'}
              highlight={highlightRequestId === row.id}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default RequestsPanel;
