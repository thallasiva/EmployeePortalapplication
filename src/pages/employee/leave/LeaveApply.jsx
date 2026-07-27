import { useCallback, useEffect, useState } from "react";
import Pagination, { usePagination } from "../../../components/Pagination";
import { CalendarDays, ChevronDown, Clock } from "lucide-react";
import { listLeaveTypes } from "../../../api/leaveType.api";
import {
    applyLeave,
    cancelLeaveRequest,
    getMyLeaveBalances,
    getMyLeaveRequests,
} from "../../../api/leaveRequest.api";
import { errorToast, successToast } from "../../../utils/ToastControllers";

/* ── constants ──────────────────────────────────────────────────────────────── */
const SESSION_OPTIONS = ["Full Day", "First Half", "Second Half"];
const LEAVE_COLORS = [
    "#f18200","#6366f1","#10b981","#ef4444",
    "#3b82f6","#a855f7","#f59e0b","#06b6d4",
];
const getLeaveColor = (idx) => LEAVE_COLORS[idx % LEAVE_COLORS.length];

const STATUS_STYLES = {
    Approved:  { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
    Rejected:  { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500" },
    Cancelled: { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400" },
    Pending:   { bg: "bg-orange-50",  text: "text-orange-600",  dot: "bg-orange-400" },
};

/* ── helpers ────────────────────────────────────────────────────────────────── */
function calcDays(from, to, fromSession, toSession) {
    if (!from || !to) return 0;
    const fromD = new Date(from), toD = new Date(to);
    if (toD < fromD) return 0;
    const diffDays = Math.round((toD - fromD) / 86400000) + 1;
    if (diffDays === 1)
        return (fromSession === "First Half" || fromSession === "Second Half") ? 0.5 : 1;
    let days = diffDays;
    if (fromSession === "Second Half") days -= 0.5;
    if (toSession === "First Half")    days -= 0.5;
    return Math.max(days, 0);
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtISO(date) {
    return date instanceof Date ? date.toISOString().split("T")[0] : date;
}

/* ── BalanceCard ────────────────────────────────────────────────────────────── */
function BalanceCard({ name, balance, total, color }) {
    const pct = total > 0 ? Math.min((balance / total) * 100, 100) : 0;
    return (
        <div className="bg-white rounded-xl border border-[#e8eef5] p-4 flex flex-col gap-2 min-w-[140px]">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#64748b] truncate">{name}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                    {balance ?? 0} left
                </span>
            </div>
            <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <div className="text-[11px] text-[#94a3b8]">
                {total - (balance ?? 0)} used / {total} total
            </div>
        </div>
    );
}

/* ── RequestCard ────────────────────────────────────────────────────────────── */
function RequestCard({ row, onCancel, cancelling }) {
    const st = STATUS_STYLES[row.status] || STATUS_STYLES.Pending;
    return (
        <div className="bg-white border border-[#e8eef5] rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                    <p className="font-semibold text-[#1f2937] text-[14px]">{row.leave_type_name}</p>
                </div>
                <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
                    {row.status}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[13px] text-[#64748b]">
                <span><strong className="text-[#374151]">From:</strong> {formatDate(row.from_date)}{row.from_session && row.from_session !== "Full Day" ? ` (${row.from_session})` : ""}</span>
                <span><strong className="text-[#374151]">To:</strong> {formatDate(row.to_date)}{row.to_session && row.to_session !== "Full Day" ? ` (${row.to_session})` : ""}</span>
                <span><strong className="text-[#374151]">Days:</strong> {row.days}</span>
                {row.reviewer_name && <span><strong className="text-[#374151]">Reviewed by:</strong> {row.reviewer_name}</span>}
                {row.reason && <span className="sm:col-span-2"><strong className="text-[#374151]">Reason:</strong> {row.reason}</span>}
                {row.remarks && <span className="sm:col-span-2"><strong className="text-[#374151]">Remarks:</strong> {row.remarks}</span>}
            </div>

            {row.status === "Pending" && (
                <div className="mt-3">
                    <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => onCancel(row.leave_request_id)}
                        className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                        {cancelling ? "Cancelling…" : "Cancel Request"}
                    </button>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function LeaveApply() {
    const [activeTab, setActiveTab] = useState("apply");

    /* form state */
    const [leaveTypes,   setLeaveTypes]   = useState([]);
    const [balances,     setBalances]     = useState([]);
    const [leaveTypeId,  setLeaveTypeId]  = useState("");
    const [fromDate,     setFromDate]     = useState("");
    const [toDate,       setToDate]       = useState("");
    const [fromSession,  setFromSession]  = useState("Full Day");
    const [toSession,    setToSession]    = useState("Full Day");
    const [reason,       setReason]       = useState("");
    const [submitting,   setSubmitting]   = useState(false);

    /* list state */
    const [pendingRequests,  setPendingRequests]  = useState([]);
    const [historyRequests,  setHistoryRequests]  = useState([]);
    const [loadingList,      setLoadingList]      = useState(false);
    const [cancellingId,     setCancellingId]     = useState(null);
    const { paged: pagedHistory, page: histPage, setPage: setHistPage, totalPages: histTotalPages, from: histFrom, to: histTo, total: histTotal, pageSize: histPageSize, setPageSize: setHistPageSize } = usePagination(historyRequests);


    /* ── initial load ─────────────────────────────────────────────────────── */
    useEffect(() => {
        listLeaveTypes()
            .then(({ data }) => setLeaveTypes(data || []))
            .catch(() => setLeaveTypes([]));
        getMyLeaveBalances()
            .then((data) => setBalances(data || []))
            .catch(() => setBalances([]));
    }, []);

    /* ── tab-specific loads ───────────────────────────────────────────────── */
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
            .then(({ data }) => setHistoryRequests((data || []).filter((r) => r.status !== "Pending")))
            .catch(() => setHistoryRequests([]))
            .finally(() => setLoadingList(false));
    }, []);

    useEffect(() => {
        if (activeTab === "pending")  loadPending();
        if (activeTab === "history")  loadHistory();
    }, [activeTab, loadPending, loadHistory]);

    /* ── computed ─────────────────────────────────────────────────────────── */
    const days = calcDays(fromDate, toDate, fromSession, toSession);
    const selectedBalance = balances.find((b) => String(b.leave_type_id) === String(leaveTypeId));
    const selectedTypeIdx = leaveTypes.findIndex((lt) => String(lt.leave_type_id) === String(leaveTypeId));
    const selectedColor   = selectedTypeIdx >= 0 ? getLeaveColor(selectedTypeIdx) : "#2ea7ff";


    /* ── actions ──────────────────────────────────────────────────────────── */
    const refreshAll = () => {
        getMyLeaveBalances().then((data) => setBalances(data || [])).catch(() => {});
        loadPending();
    };

    const handleCancel = (id) => {
        setCancellingId(id);
        cancelLeaveRequest(id)
            .then(() => { successToast("Leave request cancelled."); loadPending(); })
            .catch((err) => errorToast(err?.response?.data?.message || "Unable to cancel."))
            .finally(() => setCancellingId(null));
    };

    const handleSubmit = (e) => {
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
                setLeaveTypeId(""); setFromDate(""); setToDate("");
                setFromSession("Full Day"); setToSession("Full Day"); setReason("");
                // Refresh balances only; setActiveTab("pending") triggers loadPending via useEffect
                getMyLeaveBalances().then((data) => setBalances(data || [])).catch(() => {});
                setActiveTab("pending");
            })
            .catch((err) => errorToast(err?.response?.data?.message || "Unable to submit."))
            .finally(() => setSubmitting(false));
    };

    const handleCancelForm = () => {
        setLeaveTypeId(""); setFromDate(""); setToDate("");
        setFromSession("Full Day"); setToSession("Full Day"); setReason("");
    };

    /* ── tabs config ──────────────────────────────────────────────────────── */
    const TABS = [
        { key: "apply",   label: "Apply" },
        { key: "pending", label: `Pending${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}` },
        { key: "history", label: "History" },
    ];

    /* ══════════════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-[#f0f4f8]">
            {/* PAGE HEADER */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold text-[#1f2937]">Leave</h1>
                    <p className="text-[13px] text-[#94a3b8] mt-0.5">Manage your leave requests and view your calendar</p>
                </div>
            </div>

            {/* BALANCE CHIPS ROW */}
            {balances.length > 0 && (
                <div className="px-6 pb-4 flex gap-3 overflow-x-auto pb-2">
                    {balances.map((b, idx) => (
                        <BalanceCard
                            key={b.leave_type_id}
                            name={b.leave_type_name}
                            balance={b.available ?? b.balance ?? 0}
                            total={b.total_days ?? b.total ?? b.annual_quota ?? 0}
                            color={getLeaveColor(idx)}
                        />
                    ))}
                </div>
            )}

            {/* TABS */}
            <div className="px-6">
                <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-5 h-[38px] rounded-lg text-[13px] font-medium transition-all ${
                                activeTab === key
                                    ? "bg-[#f18200] text-white shadow-sm"
                                    : "text-[#64748b] hover:text-[#1f2937]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-6 pt-4">

                {/* ── APPLY TAB ── */}
                {activeTab === "apply" && (
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                            {/* FORM CARD */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8eef5] overflow-hidden">
                                {/* Card header */}
                                <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
                                        <CalendarDays size={16} color="#f18200" />
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-semibold text-[#1f2937]">Apply for Leave</p>
                                        <p className="text-[12px] text-[#94a3b8]">Fill in the details below to submit a leave request</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* LEAVE TYPE */}
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                            Leave Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={leaveTypeId}
                                                onChange={(e) => setLeaveTypeId(e.target.value)}
                                                className="w-full h-[44px] border border-[#e2e8f0] rounded-lg px-4 text-[14px] text-[#374151] appearance-none outline-none bg-white focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                                            >
                                                <option value="">Select leave type</option>
                                                {leaveTypes.map((lt, idx) => (
                                                    <option key={lt.leave_type_id} value={lt.leave_type_id}>
                                                        {lt.leave_type_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-3.5 text-[#94a3b8] pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* DATE RANGE */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* FROM */}
                                        <div>
                                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                                From Date <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={fromDate}
                                                    onChange={(e) => setFromDate(e.target.value)}
                                                    className="w-full h-[44px] border border-[#e2e8f0] rounded-lg px-4 text-[14px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-[12px] text-[#94a3b8] mb-1">Session</label>
                                                <div className="relative">
                                                    <select
                                                        value={fromSession}
                                                        onChange={(e) => setFromSession(e.target.value)}
                                                        className="w-full h-[38px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] appearance-none outline-none bg-white focus:border-[#f18200] transition-all"
                                                    >
                                                        {SESSION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-3 text-[#94a3b8] pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* TO */}
                                        <div>
                                            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                                To Date <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={toDate}
                                                    min={fromDate || undefined}
                                                    onChange={(e) => setToDate(e.target.value)}
                                                    className="w-full h-[44px] border border-[#e2e8f0] rounded-lg px-4 text-[14px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label className="block text-[12px] text-[#94a3b8] mb-1">Session</label>
                                                <div className="relative">
                                                    <select
                                                        value={toSession}
                                                        onChange={(e) => setToSession(e.target.value)}
                                                        className="w-full h-[38px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] appearance-none outline-none bg-white focus:border-[#f18200] transition-all"
                                                    >
                                                        {SESSION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-3 text-[#94a3b8] pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* REASON */}
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Enter your reason for leave…"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full border border-[#e2e8f0] rounded-lg p-4 text-[14px] outline-none resize-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                                        />
                                    </div>

                                    {/* BUTTONS */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="h-[42px] px-8 bg-[#f18200] hover:bg-[#e07000] rounded-lg text-white text-[14px] font-semibold disabled:opacity-60 transition-colors"
                                        >
                                            {submitting ? "Submitting…" : "Submit Request"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelForm}
                                            className="h-[42px] px-6 border border-[#e2e8f0] rounded-lg text-[#64748b] text-[14px] hover:bg-[#f8fafc] transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SUMMARY CARD */}
                            <div className="flex flex-col gap-4">
                                {/* Days summary */}
                                <div className="bg-white rounded-xl border border-[#e8eef5] p-5">
                                    <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-4">Request Summary</p>

                                    <div className="text-center mb-4">
                                        <div
                                            className="text-[48px] font-black leading-none"
                                            style={{ color: days > 0 ? selectedColor : "#e2e8f0" }}
                                        >
                                            {days}
                                        </div>
                                        <div className="text-[13px] text-[#94a3b8] mt-1">
                                            {days === 1 ? "Day" : "Days"} requested
                                        </div>
                                    </div>

                                    {fromDate && (
                                        <div className="space-y-2 text-[13px]">
                                            <div className="flex justify-between py-2 border-t border-[#f1f5f9]">
                                                <span className="text-[#94a3b8]">From</span>
                                                <span className="font-medium text-[#1f2937]">{formatDate(fromDate)}</span>
                                            </div>
                                            {toDate && (
                                                <div className="flex justify-between py-2 border-t border-[#f1f5f9]">
                                                    <span className="text-[#94a3b8]">To</span>
                                                    <span className="font-medium text-[#1f2937]">{formatDate(toDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedBalance && (
                                        <div className="mt-3 p-3 rounded-lg" style={{ background: `${selectedColor}0f` }}>
                                            <div className="flex justify-between items-center text-[13px]">
                                                <span className="text-[#64748b]">Available Balance</span>
                                                <span className="font-bold text-[16px]" style={{ color: selectedColor }}>
                                                    {selectedBalance.available ?? selectedBalance.balance ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info note */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-700">
                                    <p className="font-semibold mb-1">Important</p>
                                    <p>Leave requests require manager approval. Approved leaves will appear in your calendar.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* ── PENDING TAB ── */}
                {activeTab === "pending" && (
                    <div className="max-w-2xl">
                        {loadingList ? (
                            <div className="bg-white border border-[#e8eef5] rounded-xl h-[200px] flex items-center justify-center">
                                <p className="text-[#94a3b8] text-[14px]">Loading…</p>
                            </div>
                        ) : pendingRequests.length === 0 ? (
                            <div className="bg-white border border-[#e8eef5] rounded-xl h-[300px] flex flex-col items-center justify-center gap-3">
                                <CalendarDays size={40} className="text-[#e2e8f0]" />
                                <p className="text-[#94a3b8] text-[15px]">No pending leave requests</p>
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

                {/* ── HISTORY TAB ── */}
                {activeTab === "history" && (
                    <div className="max-w-2xl">
                        {loadingList ? (
                            <div className="bg-white border border-[#e8eef5] rounded-xl h-[200px] flex items-center justify-center">
                                <p className="text-[#94a3b8] text-[14px]">Loading…</p>
                            </div>
                        ) : historyRequests.length === 0 ? (
                            <div className="bg-white border border-[#e8eef5] rounded-xl h-[300px] flex flex-col items-center justify-center gap-3">
                                <Clock size={40} className="text-[#e2e8f0]" />
                                <p className="text-[#94a3b8] text-[15px]">No leave history found</p>
                            </div>
                        ) : (
                            <>
                            {pagedHistory.map((row) => (
                                <RequestCard key={row.leave_request_id} row={row} onCancel={() => {}} />
                            ))}
                            <Pagination page={histPage} setPage={setHistPage} totalPages={histTotalPages} from={histFrom} to={histTo} total={histTotal} pageSize={histPageSize} setPageSize={setHistPageSize} />
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
