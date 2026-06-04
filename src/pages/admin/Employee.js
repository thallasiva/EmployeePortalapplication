import React, { useRef, useState } from "react";
import { LayoutGrid, List, Upload } from "lucide-react";
import Teams from "./Teams";
import Offices from "./Offices";
import { useNavigate } from "react-router-dom";
import { getEmployeeList, importEmployeesFromCsv } from "../../data/employees";
import EmployeeGridCard, { EmployeeListTable } from "../../component/employee/EmployeeViews";
import { successToast } from "../../utils/ToastControllers";
import "../../component/employee/employee.css";

export default function Employee() {
  const navigate = useNavigate();
  const csvInputRef = useRef(null);
  const [employees, setEmployees] = useState(() => getEmployeeList());
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTab, setSelectedTab] = useState("All");

  const officesSample = [
    { name: "Sean Black", team: "Design" },
    { name: "Linda Craver", team: "IOS" },
    { name: "Jenni Sims", team: "Android" },
    { name: "Stacey Linville", team: "Testing" },
    { name: "Maria Cotton", team: "PHP" },
    { name: "John Gibbs", team: "PHP" },
    { name: "Richard Wilson", team: "Business" },
  ];

  const tabsMenu = [
    { id: 1, tabName: "All" },
    { id: 2, tabName: "Teams" },
    { id: 3, tabName: "Offices" },
  ];

  const refreshEmployees = () => setEmployees([...getEmployeeList()]);

  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const count = importEmployeesFromCsv(event.target.result);
        refreshEmployees();
        successToast(`${count} employee(s) imported from CSV`);
      } catch {
        successToast("Failed to import CSV. Check file format.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex bg-white rounded-xl shadow overflow-hidden">
          {tabsMenu.map((item) => (
            <button
              className={`${selectedTab === item.tabName ? "selected px-6 py-2" : "notSelected px-6 py-2"}`}
              key={item.id}
              type="button"
              onClick={() => setSelectedTab(item.tabName)}
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
            onChange={handleCsvImport}
          />
          <button
            type="button"
            className="emp-btn emp-btn--outline"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Import CSV
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

      {selectedTab === "All" && (
        <div className="space-y-4">
          <div className="emp-toolbar">
            <span className="font-medium">{employees.length} Employees</span>
            <div className="emp-view-toggle">
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="emp-grid">
              {employees.map((emp) => (
                <EmployeeGridCard key={emp.employee_id} employee={emp} />
              ))}
            </div>
          ) : (
            <EmployeeListTable employees={employees} />
          )}
        </div>
      )}

      {selectedTab === "Teams" && <Teams />}
      {selectedTab === "Offices" && <Offices employees={officesSample} />}
    </div>
  );
}
