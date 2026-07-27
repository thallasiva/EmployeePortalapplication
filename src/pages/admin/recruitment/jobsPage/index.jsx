import React, { useMemo } from "react";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Table } from "../shared";
import { Btn } from "../shared";
import { useJobsPage } from "./hooks/useJobsPage";
import { makeColumns } from "./utils/columns";
import JobsStatCards from "./components/JobsStatCards";
import JobsPeriodTabs from "./components/JobsPeriodTabs";
import JobsFilters from "./components/JobsFilters";
import JobDetailModal from "./components/JobDetailModal";
import AssignRecruiterModal from "./components/AssignRecruiterModal";

function JobsPage({ role }) {
  const navigate = useNavigate();
  const isAdmin = role === 1;
  const isTL = role === 4;
  const canCreate = isAdmin || isTL;
  const canAssign = isAdmin || isTL;
  const canClose = isAdmin || isTL;

  const {
    totalCount, recruiters, loading, search, setSearch,
    filterStatus, setFilterStatus, period, setPeriod,
    detailJob, setDetailJob, assignOpen, assignIds, setAssignIds,
    originalIds, assigning, loadingAssign, loadJobs,
    openAssign, closeAssign, handleAssign, handleClose,
    visibleJobs, periodCounts, totalOpen, totalCompleted,
  } = useJobsPage();

  const columns = useMemo(
    () => makeColumns({ canAssign, canClose, setDetailJob, openAssign, handleClose }),
    [canAssign, canClose, setDetailJob, openAssign, handleClose]
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Jobs"]}
        title={role === 5 ? "My Jobs" : "Job Requests"}
        subtitle="Manage open positions and recruiter assignments"
        action={
          canCreate ? (
            <div className="flex gap-2">
              <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadJobs} />
              <Btn icon={<Plus size={16} />} onClick={() => navigate("create-new")}>
                New Job Request
              </Btn>
            </div>
          ) : null
        }
      />

      <JobsStatCards
        totalCount={totalCount}
        totalOpen={totalOpen}
        totalCompleted={totalCompleted}
      />

      <Card style={{ padding: 0 }}>
        <JobsPeriodTabs period={period} setPeriod={setPeriod} periodCounts={periodCounts} />
        <JobsFilters
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          loading={loading}
          visibleCount={visibleJobs.length}
        />
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500">
            <Loader2 size={20} className="animate-spin" /> Loading jobs…
          </div>
        ) : (
          <Table columns={columns} data={visibleJobs} onRowClick={(row) => setDetailJob(row)} />
        )}
      </Card>

      <JobDetailModal
        detailJob={detailJob}
        onClose={() => setDetailJob(null)}
        canClose={canClose}
        handleClose={handleClose}
      />
      <AssignRecruiterModal
        assignOpen={assignOpen}
        onClose={closeAssign}
        recruiters={recruiters}
        assignIds={assignIds}
        setAssignIds={setAssignIds}
        originalIds={originalIds}
        assigning={assigning}
        loadingAssign={loadingAssign}
        handleAssign={handleAssign}
      />
    </div>
  );
}

export default React.memo(JobsPage);
