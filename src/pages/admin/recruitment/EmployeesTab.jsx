import { Plus, Search } from "lucide-react";
import Btn from "./Btn";
import Card from "./Card";
import { EMPLOYEES, inputClass } from "./data";
import DataTable from "./DataTable";

function EmployeesTab()
{
  return (
    <>
      <div className="mb-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
          <input readOnly placeholder="Search employee name / ID" className={`${inputClass} pl-10`} />
        </div>
        <select disabled className={inputClass}>
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <Card title="Employees" action={<Btn primary><Plus size={14} /> Add Employee</Btn>}>
        <DataTable
          columns={["EMPID", "EMPLOYEE", "DEPARTMENT", "DESIGNATION", "DOJ", "STATUS", "ACTIONS"]}
          rows={EMPLOYEES.map((row) => ({
            ...row,
            ACTIONS: <Btn small>View</Btn>,
          }))}
        />
      </Card>
    </>
  );
}

export default EmployeesTab;