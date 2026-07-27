import React, { useMemo } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Card, Btn, Table, SearchBar } from "../../shared";
import { fmt, fmtM } from "../utils/ctcUtils";
import { OFFER_CLS } from "../constants";

const OffersTableCard = React.memo(function OffersTableCard({
  tableRef, loading, visible, search, onSearch, filterStatus, onFilterChange, onView
}) {
  const columns = useMemo(() => [
    { header: "Offer ID", key: "offer_code", width: 100 },
    {
      header: "Candidate", key: "candidate_name",
      render: (v, row) => (
        <div>
          <div className="font-semibold text-gray-900">{v}</div>
          <div className="text-[11px] text-gray-500">{row.designation}</div>
        </div>
      )
    },
    { header: "Position", key: "job_title" },
    { header: "CTC / Month", key: "ctc", render: (v) => fmtM(v) },
    { header: "Joining", key: "date_of_joining", render: (v) => v?.slice(0, 10) || "—" },
    {
      header: "Status", key: "status",
      render: (v) => (
        <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-semibold ${OFFER_CLS[v] ?? "bg-gray-100 text-gray-500"}`}>{v}</span>
      )
    },
    {
      header: "", key: "offer_id", width: 60,
      render: (_, row) => (
        <Btn size="sm" variant="ghost" icon={<Eye size={13} />}
          onClick={(e) => { e.stopPropagation(); onView(row); }}>View</Btn>
      )
    }
  ], [onView]);

  return (
    <div ref={tableRef} className="scroll-mt-4">
      <Card className="!p-0">
        <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-gray-100 flex-wrap">
          <SearchBar value={search} onChange={onSearch} placeholder="Search candidate, position, offer ID…" />
          {filterStatus && (
            <span onClick={() => onFilterChange("")}
              className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full bg-indigo-100 text-indigo-700 text-[12px] font-semibold cursor-pointer">
              {filterStatus} ✕
            </span>
          )}
          <select value={filterStatus} onChange={(e) => onFilterChange(e.target.value)}
            className="text-[13px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-700 bg-white outline-none"
            style={{ fontFamily: "inherit" }}>
            <option value="">All Statuses</option>
            {["Draft", "Released", "Accepted", "Rejected"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="ml-auto text-[12px] text-gray-500">
            {loading ? "Loading…" : `${visible.length} offer${visible.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        {loading
          ? <div className="flex items-center justify-center gap-2.5 py-12 text-gray-500"><Loader2 size={20} /> Loading offers…</div>
          : <Table columns={columns} data={visible} onRowClick={(r) => onView(r)} />
        }
      </Card>
    </div>
  );
});

export default OffersTableCard;
