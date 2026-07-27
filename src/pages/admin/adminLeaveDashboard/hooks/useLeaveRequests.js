import { useCallback, useEffect, useMemo, useState } from 'react';
import { listLeaveRequests, reviewLeaveRequest } from '../../../../api/leaveRequest.api';
import { successToast, errorToast } from '../../../../utils/ToastControllers';
import {
  countApprovedThisMonth,
  getApprovedLeavesToday,
} from '../../../../utils/adminLeaveUtils';
import { formatActionDate, mapRequest } from '../utils/leaveUtils';

const today = new Date();

export function useLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(() => {
    setLoading(true);
    return listLeaveRequests({ limit: 100 })
      .then(({ data }) => {
        setRequests((data || []).map(mapRequest));
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === 'Pending'),
    [requests]
  );
  const approved = useMemo(
    () => requests.filter((r) => r.status === 'Approved'),
    [requests]
  );
  const rejected = useMemo(
    () => requests.filter((r) => r.status === 'Rejected'),
    [requests]
  );
  const onLeaveToday = useMemo(
    () => getApprovedLeavesToday(requests, today),
    [requests]
  );
  const approvedThisMonth = useMemo(
    () => countApprovedThisMonth(requests, today),
    [requests]
  );
  const requestChart = useMemo(
    () => [
      { label: 'Pending',  value: pending.length,  color: '#f97316' },
      { label: 'Approved', value: approved.length, color: '#22c55e' },
      { label: 'Rejected', value: rejected.length, color: '#ef4444' },
    ],
    [pending.length, approved.length, rejected.length]
  );

  const handleApprove = useCallback(
    (id) => {
      setRequests((curr) =>
        curr.map((r) =>
          r.id === id ? { ...r, status: 'Approved', actionOn: formatActionDate() } : r
        )
      );
      reviewLeaveRequest(id, { decision: 'Approved' })
        .then(() => {
          successToast('Leave request approved.');
          loadRequests();
        })
        .catch((err) => {
          errorToast(err?.response?.data?.message || 'Failed to approve leave request.');
          loadRequests();
        });
    },
    [loadRequests]
  );

  const handleReject = useCallback(
    (id) => {
      setRequests((curr) =>
        curr.map((r) =>
          r.id === id ? { ...r, status: 'Rejected', actionOn: formatActionDate() } : r
        )
      );
      reviewLeaveRequest(id, { decision: 'Rejected', remarks: 'Rejected by admin' })
        .then(() => {
          successToast('Leave request rejected.');
          loadRequests();
        })
        .catch((err) => {
          errorToast(err?.response?.data?.message || 'Failed to reject leave request.');
          loadRequests();
        });
    },
    [loadRequests]
  );

  return {
    requests,
    loading,
    loadRequests,
    pending,
    approved,
    rejected,
    onLeaveToday,
    approvedThisMonth,
    requestChart,
    handleApprove,
    handleReject,
  };
}
