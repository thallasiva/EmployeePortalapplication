import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { listLeaveTypes } from "../../../api/leaveType.api";
import {
    applyLeave,
    cancelLeaveRequest,
    getMyLeaveBalances,
    getMyLeaveRequests,
} from "../../../api/leaveRequest.api";
import { errorToast, successToast } from "../../../utils/ToastControllers";

const SESSION_OPTIONS = ["Full Day", "First Half", "Second Half"];

function calcDays(from, to, fromSession, toSession) {
    if (!from || !to) return 0;
    const fromD = new Date(from);
    const toD = new Date(to);
    if (toD < fromD) return 0;

    const diffDays = Math.round((toD - fromD) / 86400000) + 1;
    let days = diffDays;

    if (diffDays === 1) {
        if (fromSession === "First Half" || fromSession === "Second Half") {
            return 0.5;
        }
        return 1;
    }

    if (fromSession === "Second Half") days -= 0.5;
    if (toSession === "First Half") days -= 0.5;

    return Math.max(days, 0);
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function RequestCard({ row, onCancel, cancelling }) {
    return (
        <div className="border border-[#dce3eb] rounded p-4 mb-3 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-[#1f2937] text-[14px]">
                        {row.leave_type_name}
                    </p>
                    <p className="text-[12px] text-[#94a3b8] mt-0.5">
                        Applied on {formatDate(row.applied_on)}
                    </p>
                </div>
                <span
                    className={`text-[12px] font-medium px-3 py-1 rounded-full ${
                        row.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600"
                            : row.status === "Rejected"
                            ? "bg-red-50 text-red-600"
                            : row.status === "Cancelled"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-orange-50 text-orange-600"
                    }`}
                >
                    {row.status}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[13px] text-[#64748b]">
                <span>
                    <strong className="text-[#374151]">From:</strong> {formatDate(row.from_date)}{" "}
                    {row.from_session && row.from_session !== "Full Day" ? `(${row.from_session})` : ""}
                </span>
                <span>
                    <strong className="text-[#374151]">To:</strong> {formatDate(row.to_date)}{" "}
                    {row.to_session && row.to_session !== "Full Day" ? `(${row.to_session})` : ""}
                </span>
                <span>
                    <strong className="text-[#374151]">Days:</strong> {row.days}
                </span>
                {row.reviewer_name && (
                    <span>
                        <strong className="text-[#374151]">Reviewed by:</strong> {row.reviewer_name}
                    </span>
                )}
                {row.reason && (
                    <span className="sm:col-span-2">
                        <strong className="text-[#374151]">Reason:</strong> {row.reason}
                    </span>
                )}
                {row.remarks && (
                    <span className="sm:col-span-2">
                        <strong className="text-[#374151]">Remarks:</strong> {row.remarks}
                    </span>
                )}
            </div>

            {row.status === "Pending" && (
                <div className="mt-3">
                    <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => onCancel(row.leave_request_id)}
                        className="text-[12px] font-medium px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        {cancelling ? "Cancelling..." : "Cancel Request"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function LeaveApply() {
    const [activeTab, setActiveTab] = useState("apply");

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [balances, setBalances] = useState([]);

    const [leaveTypeId, setLeaveTypeId] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [fromSession, setFromSession] = useState("Full Day");
    const [toSession, setToSession] = useState("Full Day");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [pendingRequests, setPendingRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        listLeaveTypes()
            .then(({ data }) => setLeaveTypes(data || []))
            .catch(() => setLeaveTypes([]));

        getMyLeaveBalances()
            .then((data) => setBalances(data || []))
            .catch(() => setBalances([]));
    }, []);

    const loadPending = () => {
        setLoadingList(true);
        getMyLeaveRequests({ status: "Pending" })
            .then(({ data }) => setPendingRequests(data || []))
            .catch(() => setPendingRequests([]))
            .finally(() => setLoadingList(false));
    };

    const loadHistory = () => {
        setLoadingList(true);
        getMyLeaveRequests({})
            .then(({ data }) => setHistoryRequests((data || []).filter((r) => r.status !== "Pending")))
            .catch(() => setHistoryRequests([]))
            .finally(() => setLoadingList(false));
    };

    useEffect(() => {
        if (activeTab === "pending") loadPending();
        if (activeTab === "history") loadHistory();
    }, [activeTab]);

    const refreshAll = () => {
        getMyLeaveBalances()
            .then((data) => setBalances(data || []))
            .catch(() => {});
        loadPending();
    };

    const handleCancel = (id) => {
        setCancellingId(id);
        cancelLeaveRequest(id)
            .then(() => {
                successToast("Leave request cancelled.");
                loadPending();
            })
            .catch((err) => errorToast(err?.response?.data?.message || "Unable to cancel request."))
            .finally(() => setCancellingId(null));
    };

    const days = calcDays(fromDate, toDate, fromSession, toSession);

    const selectedBalance = balances.find(
        (b) => String(b.leave_type_id) === String(leaveTypeId)
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!leaveTypeId) {
            errorToast("Please select a leave type.");
            return;
        }
        if (!fromDate || !toDate) {
            errorToast("Please select from and to dates.");
            return;
        }
        if (!reason.trim()) {
            errorToast("Please enter a reason.");
            return;
        }

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
                setLeaveTypeId("");
                setFromDate("");
                setToDate("");
                setFromSession("Full Day");
                setToSession("Full Day");
                setReason("");
                refreshAll();
                setActiveTab("pending");
            })
            .catch((err) => {
                errorToast(err?.response?.data?.message || "Unable to submit leave request.");
            })
            .finally(() => setSubmitting(false));
    };

    const handleCancelForm = () => {
        setLeaveTypeId("");
        setFromDate("");
        setToDate("");
        setFromSession("Full Day");
        setToSession("Full Day");
        setReason("");
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4">
                <h1 className="text-[20px] font-semibold text-[#1f2937]">
                    Leave Apply
                </h1>
            </div>

            {/* BODY */}

            <div className="flex">
                {/* CONTENT */}

                <div className="flex-1 p-5">
                    {/* TABS */}

                    <div className="flex justify-center mb-5">
                        <div className="flex border border-[#d6dce5] rounded overflow-hidden">
                            <button
                                onClick={() => setActiveTab("apply")}
                                className={`min-w-[150px] h-[42px] text-[14px] font-medium ${
                                    activeTab === "apply"
                                        ? "bg-[#2ea7ff] text-white"
                                        : "bg-white text-[#64748b]"
                                }`}
                            >
                                Apply
                            </button>

                            <button
                                onClick={() => setActiveTab("pending")}
                                className={`min-w-[150px] h-[42px] text-[14px] font-medium border-l border-r border-[#d6dce5] ${
                                    activeTab === "pending"
                                        ? "bg-[#2ea7ff] text-white"
                                        : "bg-white text-[#64748b]"
                                }`}
                            >
                                Pending {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}
                            </button>

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`min-w-[150px] h-[42px] text-[14px] font-medium ${
                                    activeTab === "history"
                                        ? "bg-[#2ea7ff] text-white"
                                        : "bg-white text-[#64748b]"
                                }`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    {/* APPLY FORM */}

                    {activeTab === "apply" && (
                        <form onSubmit={handleSubmit} className="bg-white border border-[#dce3eb]">
                            {/* INFO BAR */}

                            <div className="bg-[#fff9db] px-5 py-3 text-[13px] text-[#6b7280] flex justify-between">
                                <span>
                                    Leave is earned by an employee and granted by the employer to
                                    take time off work.
                                </span>
                            </div>

                            {/* FORM */}

                            <div className="p-6">
                                <h2 className="text-[16px] font-medium text-[#374151] mb-6">
                                    Applying for Leave
                                </h2>

                                <div className="grid grid-cols-12 gap-5">
                                    {/* LEFT FORM */}

                                    <div className="col-span-12 lg:col-span-8">
                                        {/* LEAVE TYPE */}

                                        <div className="mb-5">
                                            <label className="block text-[13px] text-[#6b7280] mb-2">
                                                Leave type <span className="text-red-500">*</span>
                                            </label>

                                            <div className="relative">
                                                <select
                                                    value={leaveTypeId}
                                                    onChange={(e) => setLeaveTypeId(e.target.value)}
                                                    className="w-full h-[42px] border border-[#cfd8e3] rounded px-4 text-[14px] text-[#374151] appearance-none outline-none bg-white"
                                                >
                                                    <option value="">Select type</option>
                                                    {leaveTypes.map((lt) => (
                                                        <option key={lt.leave_type_id} value={lt.leave_type_id}>
                                                            {lt.leave_type_name}
                                                        </option>
                                                    ))}
                                                </select>

                                                <ChevronDown
                                                    size={16}
                                                    className="absolute right-4 top-3 text-[#94a3b8] pointer-events-none"
                                                />
                                            </div>
                                        </div>

                                        {/* DATES */}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {/* FROM */}

                                            <div>
                                                <label className="block text-[13px] text-[#6b7280] mb-2">
                                                    From date <span className="text-red-500">*</span>
                                                </label>

                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={fromDate}
                                                        onChange={(e) => setFromDate(e.target.value)}
                                                        className="w-full h-[42px] border border-[#cfd8e3] rounded px-4 text-[14px] outline-none"
                                                    />

                                                    <CalendarDays
                                                        size={16}
                                                        className="absolute right-4 top-3 text-[#94a3b8] pointer-events-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* SESSION */}

                                            <div>
                                                <label className="block text-[13px] text-[#6b7280] mb-2">
                                                    Session
                                                </label>

                                                <div className="relative">
                                                    <select
                                                        value={fromSession}
                                                        onChange={(e) => setFromSession(e.target.value)}
                                                        className="w-full h-[42px] border border-[#cfd8e3] rounded px-4 appearance-none outline-none text-[14px]"
                                                    >
                                                        {SESSION_OPTIONS.map((s) => (
                                                            <option key={s} value={s}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <ChevronDown
                                                        size={16}
                                                        className="absolute right-4 top-3 text-[#94a3b8] pointer-events-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* TO DATE */}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                                            <div>
                                                <label className="block text-[13px] text-[#6b7280] mb-2">
                                                    To date <span className="text-red-500">*</span>
                                                </label>

                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={toDate}
                                                        onChange={(e) => setToDate(e.target.value)}
                                                        className="w-full h-[42px] border border-[#cfd8e3] rounded px-4 text-[14px] outline-none"
                                                    />

                                                    <CalendarDays
                                                        size={16}
                                                        className="absolute right-4 top-3 text-[#94a3b8] pointer-events-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[13px] text-[#6b7280] mb-2">
                                                    Session
                                                </label>

                                                <div className="relative">
                                                    <select
                                                        value={toSession}
                                                        onChange={(e) => setToSession(e.target.value)}
                                                        className="w-full h-[42px] border border-[#cfd8e3] rounded px-4 appearance-none outline-none text-[14px]"
                                                    >
                                                        {SESSION_OPTIONS.map((s) => (
                                                            <option key={s} value={s}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <ChevronDown
                                                        size={16}
                                                        className="absolute right-4 top-3 text-[#94a3b8] pointer-events-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* REASON */}

                                        <div className="mt-6">
                                            <label className="block text-[13px] text-[#6b7280] mb-2">
                                                Reason <span className="text-red-500">*</span>
                                            </label>

                                            <textarea
                                                rows={4}
                                                placeholder="Enter a reason"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="w-full border border-[#cfd8e3] rounded p-4 text-[14px] outline-none resize-none"
                                            />
                                        </div>

                                        {/* BUTTONS */}

                                        <div className="mt-8 flex justify-center gap-4">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="h-[40px] px-8 bg-[#2ea7ff] hover:bg-[#1d95f0] rounded text-white text-[14px] font-medium disabled:opacity-60"
                                            >
                                                {submitting ? "Submitting..." : "Submit"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleCancelForm}
                                                className="h-[40px] px-8 border border-[#cfd8e3] rounded text-[#64748b] text-[14px] bg-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE */}

                                    <div className="col-span-12 lg:col-span-4">
                                        <div className="mt-2 lg:mt-24 text-[14px] text-[#64748b] space-y-2">
                                            <p>
                                                Leave Balance:
                                                <span className="ml-2 font-medium text-[#111827]">
                                                    {selectedBalance ? selectedBalance.balance ?? 0 : "—"}
                                                </span>
                                            </p>

                                            <p>
                                                Applying For:
                                                <span className="ml-2 font-medium text-[#111827]">
                                                    {days} {days === 1 ? "Day" : "Days"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* PENDING */}

                    {activeTab === "pending" && (
                        <div className="mt-5">
                            {loadingList ? (
                                <div className="bg-white border border-[#dce3eb] h-[200px] flex items-center justify-center">
                                    <p className="text-[#94a3b8] text-[14px]">Loading...</p>
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <div className="bg-white border border-[#dce3eb] h-[400px] flex items-center justify-center">
                                    <p className="text-[#94a3b8] text-[18px]">No Pending Leaves</p>
                                </div>
                            ) : (
                                pendingRequests.map((row) => (
                                    <RequestCard
                                        key={row.leave_request_id}
                                        row={row}
                                        onCancel={handleCancel}
                                        cancelling={cancellingId === row.leave_request_id}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* HISTORY */}

                    {activeTab === "history" && (
                        <div className="mt-5">
                            {loadingList ? (
                                <div className="bg-white border border-[#dce3eb] h-[200px] flex items-center justify-center">
                                    <p className="text-[#94a3b8] text-[14px]">Loading...</p>
                                </div>
                            ) : historyRequests.length === 0 ? (
                                <div className="bg-white border border-[#dce3eb] h-[400px] flex items-center justify-center">
                                    <p className="text-[#94a3b8] text-[18px]">No Leave History</p>
                                </div>
                            ) : (
                                historyRequests.map((row) => (
                                    <RequestCard key={row.leave_request_id} row={row} onCancel={() => {}} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
