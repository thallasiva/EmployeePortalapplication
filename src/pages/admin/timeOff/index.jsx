import React, { useState } from "react";
import { cssClass } from "../../../utils/classStyles";
import { CURRENT_YEAR } from "./constants";
import { useHolidays } from "./hooks/useHolidays";
import Toast from "./components/Toast";
import PageHeader from "./components/PageHeader";
import HolidayPanel from "./components/HolidayPanel";
import HolidaySummary from "./components/HolidaySummary";
import ShiftLegend from "./components/ShiftLegend";
import HolidayModal from "./components/HolidayModal";
import CSVUploadModal from "./components/CSVUploadModal";

export default function TimeOff() {
  const [shift, setShift] = useState("general");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [locationFilter, setLocFilter] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showCSV, setShowCSV] = useState(false);

  const { allHolidays, allLocations, loading, toast, handleSave, handleDelete, handleCSVImported } =
    useHolidays(year);

  const openAddHoliday = () => { setEditModal(null); setShowEdit(true); };
  const openEditHoliday = (h) => { setEditModal(h); setShowEdit(true); };
  const closeEdit = () => { setShowEdit(false); setEditModal(null); };
  const onSaved = async (form) => { await handleSave(form); closeEdit(); };
  const onCSVImported = (count) => { setShowCSV(false); handleCSVImported(count); };

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f8f9fb", padding: "24px 28px",
      fontFamily: "'Inter','Plus Jakarta Sans',system-ui,sans-serif" })}>
      <Toast {...(toast || { msg: null })} />

      <div className={cssClass({ maxWidth: 1280, margin: "0 auto" })}>
        <PageHeader
          year={year}
          locationFilter={locationFilter}
          allLocations={allLocations}
          onYearChange={setYear}
          onLocationChange={setLocFilter}
          onAddHoliday={openAddHoliday}
          onUploadCSV={() => setShowCSV(true)}
        />

        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 300px", gap: 22, alignItems: "start" })}>
          <HolidayPanel
            shift={shift}
            year={year}
            locationFilter={locationFilter}
            allHolidays={allHolidays}
            loading={loading}
            onShiftChange={setShift}
            onAddHoliday={openAddHoliday}
            onEdit={openEditHoliday}
            onDelete={handleDelete}
          />
          <HolidaySummary allHolidays={allHolidays} year={year} locationFilter={locationFilter} />
        </div>

        <ShiftLegend />
      </div>

      {showEdit && (
        <HolidayModal
          initial={editModal}
          locations={allLocations}
          defaultShift={shift}
          onClose={closeEdit}
          onSave={onSaved}
        />
      )}
      {showCSV && (
        <CSVUploadModal
          onClose={() => setShowCSV(false)}
          onImported={onCSVImported}
        />
      )}
    </div>
  );
}
