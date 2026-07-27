import React from "react";
import { Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cssClass } from "../../../../utils/classStyles";
import { downloadEmployeeCsvTemplate } from "../../../../utils/employeeCsvImport";

const TABS = [
  { id: 1, tabName: "All" },
  { id: 2, tabName: "Teams" },
];

const EmployeeToolbar = React.memo(function EmployeeToolbar({
  selectedTab,
  onSelectTab,
  csvInputRef,
  onCsvImport,
  onCsvExport,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center flex-wrap gap-3">
      <div className="flex bg-white rounded-xl shadow overflow-hidden">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${selectedTab === item.tabName ? "selected px-6 py-2" : "notSelected px-6 py-2"}`}
            onClick={() => onSelectTab(item.tabName)}
          >
            {item.tabName}
          </button>
        ))}
      </div>
      <div className="emp-toolbar__actions">
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          className="emp-csv-input"
          onChange={onCsvImport}
        />
        <button
          type="button"
          className="emp-btn emp-btn--outline"
          onClick={() => downloadEmployeeCsvTemplate()}
          title="Download CSV template"
        >
          <Download
            size={16}
            className={cssClass({ display: "inline", verticalAlign: "middle", marginRight: 4 })}
          />{" "}
          Template
        </button>
        <button
          type="button"
          className="emp-btn emp-btn--outline"
          onClick={() => csvInputRef.current?.click()}
        >
          <Upload
            size={16}
            className={cssClass({ display: "inline", verticalAlign: "middle", marginRight: 4 })}
          />{" "}
          Import CSV
        </button>
        <button type="button" className="emp-btn emp-btn--outline" onClick={onCsvExport}>
          <Download
            size={16}
            className={cssClass({ display: "inline", verticalAlign: "middle", marginRight: 4 })}
          />{" "}
          Export CSV
        </button>
        <button
          type="button"
          className="emp-btn emp-btn--primary"
          onClick={() => navigate("/dashboard/create-employee")}
        >
          + Add Employee
        </button>
      </div>
    </div>
  );
});

export default EmployeeToolbar;
