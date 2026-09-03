import { useCallback, useEffect, useState } from "react";
import { usePagination } from "../../../../../components/Pagination";
import { listLeaveTypes } from "../../../../../api/leaveType.api";
import {
  applyLeave,
  cancelLeaveRequest,
  getMyLeaveBalances,
  getMyLeaveRequests,
} from "../../../../../api/leaveRequest.api";
import { apiErrorToast, errorToast, successToast } from "../../../../../utils/ToastControllers";
import { calcDays, getLeaveColor } from "../utils";

export default function useLeaveApply() {
  const [activeTab, setActiveTab] = useState("apply");

  // Form state
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromSession, setFromSession] = useState("Full Day");
  const [toSession, setToSession] = useState("Full Day");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // List state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const {
    paged: pagedHistory,
    page: histPage,
    setPage: setHistPage,
    totalPages: histTotalPages,
    from: histFrom,
    to: histTo,
    total: histTotal,
    pageSize: histPageSize,
    setPageSize: setHistPageSize,
  } = usePagination(historyRequests);

  // Initial data load
  useEffect(() => {
    listLeaveTypes()
      .then(({ data }) => setLeaveTypes(data || []))
      .catch(() => setLeaveTypes([]));
    getMyLeaveBalances()
      .then((data) => setBalances(data || []))
      .catch(() => setBalances([]));
  }, []);

  const loadPending = useCallback(() => {
    setLoadingList(true);
    getMyLeaveRequests({ status: "Pending" })
      .then(({ data }) => setPendingRequests(data || []))
      .catch(() => setPendingRequests([]))
      .finally(() => setLoadingList(false));
  }, []);

  const loadHistory = useCallback(() => {
    setLoadingList(true);
    getMyLeaveRequests({})
      .then(({ data }) =>
        setHistoryRequests((data || []).filter((r) => r.status !== "Pending"))
      )
      .catch(() => setHistoryRequests([]))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (activeTab === "pending") loadPending();
    if (activeTab === "history") loadHistory();
  }, [activeTab, loadPending, loadHistory]);

  // Derived values
  const days = calcDays(fromDate, toDate, fromSession, toSession);
  const selectedBalance = balances.find(
    (b) => String(b.leave_type_id) === String(leaveTypeId)
  );
  const selectedTypeIdx = leaveTypes.findIndex(
    (lt) => String(lt.leave_type_id) === String(leaveTypeId)
  );
  const selectedColor = selectedTypeIdx >= 0 ? getLeaveColor(selectedTypeIdx) : "#2ea7ff";

  const resetForm = useCallback(() => {
    setLeaveTypeId("");
    setFromDate("");
    setToDate("");
    setFromSession("Full Day");
    setToSession("Full Day");
    setReason("");
  }, []);

  const handleCancel = useCallback(
    (id) => {
      setCancellingId(id);
      cancelLeaveRequest(id)
        .then(() => {
          successToast("Leave request cancelled.");
          loadPending();
        })
        .catch((err) => apiErrorToast(err, "Unable to cancel."))
        .finally(() => setCancellingId(null));
    },
    [loadPending]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!leaveTypeId) { errorToast("Please select a leave type."); return; }
      if (!fromDate || !toDate) { errorToast("Please select from and to dates."); return; }
      if (!reason.trim()) { errorToast("Please enter a reason."); return; }

      setSubmitting(true);
      applyLeave({
        leave_type_id: Number(leaveTypeId),
        from_date: fromDate,
        from_session: fromSession === "Full Day" ? null : fromSession,
        to_date: toDate,
        to_session: toSession === "Full Day" ? null : toSession,
        days,
        reason,
      })
        .then(() => {
          successToast("Leave request submitted.");
          resetForm();
          getMyLeaveBalances()
            .then((data) => setBalances(data || []))
            .catch(() => {});
          setActiveTab("pending");
        })
        .catch((err) => apiErrorToast(err, "Unable to submit."))
        .finally(() => setSubmitting(false));
    },
    [days, fromDate, fromSession, leaveTypeId, reason, resetForm, toDate, toSession]
  );

  return {
    activeTab,
    setActiveTab,
    leaveTypes,
    balances,
    leaveTypeId,
    setLeaveTypeId,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    fromSession,
    setFromSession,
    toSession,
    setToSession,
    reason,
    setReason,
    submitting,
    pendingRequests,
    historyRequests,
    loadingList,
    cancellingId,
    pagedHistory,
    histPage,
    setHistPage,
    histTotalPages,
    histFrom,
    histTo,
    histTotal,
    histPageSize,
    setHistPageSize,
    days,
    selectedBalance,
    selectedColor,
    handleCancel,
    handleSubmit,
    resetForm,
  };
}
