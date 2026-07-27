import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload } from 'lucide-react';
import {
  ADMIN_LEAVE_SUMMARY,
  ADMIN_TOTAL_EMPLOYEES,
  CALENDAR_PURPOSE,
} from '../../../data/adminLeaveData';
import TeamAvailabilityCalendar from '../../../component/admin/TeamAvailabilityCalendar';
import LeaveEmployeeDetailTable from '../../../component/admin/LeaveEmployeeDetailTable';
import '../adminDashboard.css';
import { useLeaveRequests } from './hooks/useLeaveRequests';
import LeaveTypeCard from './components/LeaveTypeCard';
import QuickStatsSection from './components/QuickStatsSection';
import AnalyticsSection from './components/AnalyticsSection';
import RequestsPanel from './components/RequestsPanel';
import LeavePolicySection from './components/LeavePolicySection';
import ImportHolidayCalendarModal from './components/ImportHolidayCalendarModal';

const today = new Date();

export default function AdminLeaveDashboard() {
  const location = useLocation();
  const requestsPanelRef = useRef(null);
  const statDetailRef = useRef(null);

  const [requestTab, setRequestTab] = useState(location.state?.tab ?? 'pending');
  const [highlightRequestId, setHighlightRequestId] = useState(
    location.state?.requestId ?? null
  );
  const [statFilter, setStatFilter] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const {
    requests,
    loading,
    pending,
    approved,
    rejected,
    onLeaveToday,
    approvedThisMonth,
    requestChart,
    handleApprove,
    handleReject,
  } = useLeaveRequests();

  useEffect(() => {
    if (location.state?.tab) setRequestTab(location.state.tab);
    if (location.state?.requestId) {
      setHighlightRequestId(location.state.requestId);
      setRequestTab('pending');
      setTimeout(() => {
        requestsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document
          .getElementById(`leave-request-${location.state.requestId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [location.state]);

  const tabRows =
    requestTab === 'pending' ? pending : requestTab === 'approved' ? approved : rejected;

  const statDetailRows = useMemo(() => {
    if (statFilter === 'pending') return pending;
    if (statFilter === 'approved')
      return approved.filter((r) => {
        const d = new Date(r.from);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
    if (statFilter === 'teamOut') return onLeaveToday;
    return [];
  }, [statFilter, pending, approved, onLeaveToday]);

  const statDetailTitle =
    statFilter === 'pending'
      ? 'All Pending Requests'
      : statFilter === 'approved'
      ? 'Approved This Month'
      : statFilter === 'teamOut'
      ? 'Team Out Today'
      : '';

  const openStat = useCallback(
    (filter) => {
      setStatFilter(filter);
      if (filter === 'pending') setRequestTab('pending');
      if (filter === 'approved') setRequestTab('approved');
      setTimeout(() => statDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    },
    []
  );

  return (
    <div className="admin-dash space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor team leave, requests, and availability across all employees
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Upload size={16} />
          Import Holiday Calendar
        </button>
      </div>

      {showImportModal && (
        <ImportHolidayCalendarModal
          onClose={() => setShowImportModal(false)}
          onImported={() => {}}
        />
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Leave Overview by Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADMIN_LEAVE_SUMMARY.map((item) => (
            <LeaveTypeCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <QuickStatsSection
        pendingCount={pending.length}
        onLeaveTodayCount={onLeaveToday.length}
        approvedThisMonth={approvedThisMonth}
        statFilter={statFilter}
        statDetailRef={statDetailRef}
        statDetailTitle={statDetailTitle}
        statDetailRows={statDetailRows}
        onOpenStat={openStat}
        onCloseStatFilter={() => setStatFilter(null)}
      />

      <AnalyticsSection requestChart={requestChart} totalRequests={requests.length} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="admin-dash-card">
          <TeamAvailabilityCalendar
            requests={requests}
            totalEmployees={ADMIN_TOTAL_EMPLOYEES}
            purposeText={CALENDAR_PURPOSE}
            initialDate={today}
          />
        </div>
        <RequestsPanel
          panelRef={requestsPanelRef}
          requestTab={requestTab}
          onTabChange={setRequestTab}
          pending={pending}
          approved={approved}
          rejected={rejected}
          tabRows={tabRows}
          loading={loading}
          highlightRequestId={highlightRequestId}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </section>

      <section className="admin-dash-card">
        <h3 className="font-semibold text-gray-900 mb-4">All Employees on Leave Today</h3>
        <LeaveEmployeeDetailTable
          rows={onLeaveToday.map((r) => ({ ...r, status: 'Approved' }))}
          emptyMessage="No employees on approved leave today."
        />
      </section>

      <LeavePolicySection />
    </div>
  );
}
