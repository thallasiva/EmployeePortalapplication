import React, { useEffect, useRef, useState } from "react";
import { Download, LayoutGrid, List, Upload } from "lucide-react";
import Teams from "./Teams";
import Offices from "./Offices";
import { useNavigate } from "react-router-dom";
import { listEmployees, createEmployee } from "../../api/employee.api";
import { getErrorMessage } from "../../api/client";
import { parseEmployeeCsv, mapCsvRowToEmployee } from "../../utils/employeeCsvImport";
import { downloadEmployeeCsv } from "../../utils/employeeCsvExport";
import EmployeeGridCard, { EmployeeListTable } from "../../component/employee/EmployeeViews";
import { successToast, errorToast } from "../../utils/ToastControllers";
import "../../component/employee/employee.css";

export default function Employee() {
  const navigate = useNavigate();
  const csvInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTab, setSelectedTab] = useState("All");

  const refreshEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await listEmployees({ limit: 200 });
      setEmployees(data);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEmployees();
  }, []);

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

  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let rows = [];
      try {
        rows = parseEmployeeCsv(event.target.result);
      } catch {
        errorToast("Failed to parse CSV. Check file format.");
        e.target.value = "";
        return;
      }

      // Lookup table of emp_code -> employee_id for resolving "Manager Employee Number"
      const codeToId = new Map();
      employees.forEach((emp) => {
        if (emp.emp_code) codeToId.set(String(emp.emp_code), emp.employee_id);
      });

      let created = 0;
      let failed = 0;
      for (const row of rows) {
        const { employee, contactInfo, bankDetails, managerEmployeeNumber } = mapCsvRowToEmployee(row);
        if (!employee.first_name && !employee.email) continue;

        const reportingTo = managerEmployeeNumber && codeToId.has(managerEmployeeNumber)
          ? codeToId.get(managerEmployeeNumber)
          : null;

        try {
          await createEmployee({
            emp_code: employee.emp_code || undefined,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email,
            mobile: employee.mobile,
            emp_job_title: employee.emp_job_title,
            department_id: employee.department_id ? Number(employee.department_id) : undefined,
            employee_type: employee.employee_type,
            employee_status: employee.employee_status,
            emp_joining_date: employee.emp_joining_date,
            emp_exit_date: employee.emp_exit_date || undefined,
            ctc: employee.ctc,
            assigned_member: employee.assigned_member,
            benefits_plan: employee.benefits_plan,
            role_id: Number(employee.role) || 2,
            reporting_to: reportingTo,
            gender: employee.gender || undefined,
            dob: employee.dob || undefined,
            marital_status: employee.marital_status || undefined,
            father_name: employee.father_name || undefined,
            spouse_name: employee.spouse_name || undefined,
            aadhaar_number: employee.aadhaar_number || undefined,
            aadhaar_name: employee.aadhaar_name || undefined,
            aadhaar_enrolment_number: employee.aadhaar_enrolment_number || undefined,
            access_card_number: employee.access_card_number || undefined,
            access_card_from_date: employee.access_card_from_date || undefined,
            access_card_to_date: employee.access_card_to_date || undefined,
            pf_number: employee.pf_number || undefined,
            pf_join_date: employee.pf_join_date || undefined,
            esi_number: employee.esi_number || undefined,
            has_left_organization: employee.has_left_organization,
            contactInfo,
            bankDetails,
          });
          created += 1;
        } catch {
          failed += 1;
        }
      }

      await refreshEmployees();
      if (created) successToast(`${created} employee(s) imported from CSV`);
      if (failed) errorToast(`${failed} row(s) failed to import`);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    if (!employees.length) {
      errorToast("No employees to export");
      return;
    }
    downloadEmployeeCsv(employees, `employees-${new Date().toISOString().slice(0, 10)}.csv`);
    successToast("Employee list exported");
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
            className="emp-btn emp-btn--outline"
            onClick={handleCsvExport}
          >
            <Download size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
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

      {selectedTab === "All" && (
        <div className="space-y-4">
          <div className="emp-toolbar">
            <span className="font-medium">
              {loading ? "Loading employees…" : `${employees.length} Employees`}
            </span>
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
