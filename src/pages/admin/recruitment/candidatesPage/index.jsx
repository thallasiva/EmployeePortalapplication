import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { PageHeader, Btn } from "../shared";
import { useCandidatesData } from "./hooks/useCandidatesData";
import StatusStrips from "./components/StatusStrips";
import CandidateTable from "./components/CandidateTable";
import AddCandidateWizard from "./components/AddCandidateWizard";
import CandidateProfileModal from "./components/CandidateProfileModal";
import { BLANK_INT } from "./constants";

export default function CandidatesPage({ role }) {
  const {
    candidates, jobs, recruiters, loading, filtered,
    search, filterStatus, filterJob,
    addOpen, detail, tableRef,
    isAdmin, isTL, isHRMgr, isRecruiter,
    setSearch, setFilterStatus, setFilterJob,
    setAddOpen, setDetail,
    loadCandidates, updateStatus,
  } = useCandidatesData({ role });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Dashboard", "Candidates"]}
        title={isRecruiter ? "My Candidates" : "Candidates"}
        subtitle="Track all candidate profiles and pipeline status"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" icon={<RefreshCw size={14} />} onClick={loadCandidates} />
            <Btn icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>Add Candidate</Btn>
          </div>
        } />

      <StatusStrips
        candidates={candidates}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        tableRef={tableRef} />

      <CandidateTable
        loading={loading} filtered={filtered} jobs={jobs}
        search={search} filterJob={filterJob} filterStatus={filterStatus}
        isRecruiter={isRecruiter} isHRMgr={isHRMgr} isTL={isTL}
        setSearch={setSearch} setFilterJob={setFilterJob} setFilterStatus={setFilterStatus}
        setDetail={setDetail} updateStatus={updateStatus}
        tableRef={tableRef} />

      <AddCandidateWizard
        open={addOpen}
        onClose={() => setAddOpen(false)}
        jobs={jobs.filter((j) => !j.assignment_status || j.assignment_status === "Open")}
        recruiters={recruiters}
        isRecruiter={isRecruiter}
        onSuccess={() => { setAddOpen(false); loadCandidates(); }} />

      <CandidateProfileModal
        detail={detail} role={role}
        isAdmin={isAdmin} isTL={isTL} isHRMgr={isHRMgr} isRecruiter={isRecruiter}
        onClose={() => setDetail(null)}
        updateStatus={updateStatus}
/>
    </div>
  );
}
