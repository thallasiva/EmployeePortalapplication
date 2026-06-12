import { useMemo, useState } from "react";
import { successToast } from "../../utils/ToastControllers";
import { ChevronDown, Download, Pencil, Plus, Search } from "lucide-react";
import PayslipModal from "./PayslipModal";
import AddSalaryModal from "./AddSalaryModal";
import { getDesignations, getEmployeeList } from "../../data/employees";

const PayRollForm = () =>
{
    const employees = useMemo(() => getEmployeeList(), []);
    const designations = useMemo(() => getDesignations(), []);

    const SALARY_STORAGE_KEY = "employeeSalaryMap";
    const DESIGNATION_STORAGE_KEY = "employeeDesignationOverrides";

    const getFullName = (emp) => `${emp.first_name || ""} ${emp.lasst_name || ""}`.trim();


    const SORT_OPTIONS = [
        { value: "recent", label: "Sort By: Last 7 Days" },
        { value: "name-asc", label: "Name (A - Z)" },
        { value: "salary-desc", label: "Salary (High - Low)" },
        { value: "salary-asc", label: "Salary (Low - High)" },
        { value: "joining-desc", label: "Joining Date (Newest)" },
    ];

    const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

    function readJSON(key, fallback)
    {
        try
        {
            const stored = window.localStorage.getItem(key);
            return stored ? JSON.parse(stored) : fallback;
        } catch
        {
            return fallback;
        }
    }

    function writeJSON(key, value)
    {
        window.localStorage.setItem(key, JSON.stringify(value));
    }



    const formatDate = (iso) =>
    {
        if (!iso) return "—";
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };



    const getInitials = (firstName, lastName) =>
        `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "—";




    const [salaryMap, setSalaryMap] = useState(() => readJSON(SALARY_STORAGE_KEY, {}));
    const [designationMap, setDesignationMap] = useState(() => readJSON(DESIGNATION_STORAGE_KEY, {}));

    const [search, setSearch] = useState("");
    const [designationFilter, setDesignationFilter] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportOpen, setExportOpen] = useState(false);
    const [slipEmployee, setSlipEmployee] = useState(null);
    const [salaryModal, setSalaryModal] = useState(null);

    const designationName = (id) =>
        designations.find((d) => d.designation_id === Number(id))?.designation_name || "—";

    const getSalary = (emp) => salaryMap[emp.employee_id] ?? emp.base_salary ?? 0;
    const getDesignationId = (emp) => designationMap[emp.employee_id] ?? emp.designation_id;

    const enrichedEmployees = useMemo(
        () =>
            employees.map((emp) => ({
                ...emp,
                salary: getSalary(emp),
                designationId: getDesignationId(emp),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [employees, salaryMap, designationMap]
    );

    const filteredEmployees = useMemo(() =>
    {
        let list = enrichedEmployees;

        if (search.trim())
        {
            const q = search.trim().toLowerCase();
            list = list.filter((emp) =>
            {
                const name = getFullName(emp).toLowerCase();
                return (
                    name.includes(q) ||
                    emp.email?.toLowerCase().includes(q) ||
                    emp.mobile?.toLowerCase().includes(q) ||
                    `emp-${String(emp.employee_id).padStart(3, "0")}`.toLowerCase().includes(q)
                );
            });
        }

        if (designationFilter)
        {
            list = list.filter((emp) => String(emp.designationId) === designationFilter);
        }

        if (dateFrom)
        {
            list = list.filter((emp) => !emp.emp_joining_date || emp.emp_joining_date >= dateFrom);
        }

        if (dateTo)
        {
            list = list.filter((emp) => !emp.emp_joining_date || emp.emp_joining_date <= dateTo);
        }

        const sorted = [...list];
        switch (sortBy)
        {
            case "name-asc":
                sorted.sort((a, b) => getFullName(a).localeCompare(getFullName(b)));
                break;
            case "salary-desc":
                sorted.sort((a, b) => b.salary - a.salary);
                break;
            case "salary-asc":
                sorted.sort((a, b) => a.salary - b.salary);
                break;
            case "joining-desc":
                sorted.sort((a, b) => new Date(b.emp_joining_date || 0) - new Date(a.emp_joining_date || 0));
                break;
            default:
                break;
        }

        return sorted;
    }, [enrichedEmployees, search, designationFilter, dateFrom, dateTo, sortBy]);

    const visibleEmployees = filteredEmployees.slice(0, rowsPerPage);

    const allVisibleSelected =
        visibleEmployees.length > 0 && visibleEmployees.every((emp) => selectedIds.includes(emp.employee_id));

    const toggleSelectAll = () =>
    {
        if (allVisibleSelected)
        {
            setSelectedIds((prev) => prev.filter((id) => !visibleEmployees.some((emp) => emp.employee_id === id)));
        } else
        {
            setSelectedIds((prev) => [
                ...prev,
                ...visibleEmployees.filter((emp) => !prev.includes(emp.employee_id)).map((emp) => emp.employee_id),
            ]);
        }
    };

    const toggleSelectOne = (id) =>
    {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const handleDesignationChange = (employeeId, designationId) =>
    {
        setDesignationMap((prev) =>
        {
            const next = { ...prev, [employeeId]: Number(designationId) };
            writeJSON(DESIGNATION_STORAGE_KEY, next);
            return next;
        });
    };

    const handleSaveSalary = (employeeId, salary) =>
    {
        setSalaryMap((prev) =>
        {
            const next = { ...prev, [employeeId]: salary };
            writeJSON(SALARY_STORAGE_KEY, next);
            return next;
        });
        successToast("Salary saved successfully.");
        setSalaryModal(null);
    };

    const handleExport = (format) =>
    {
        setExportOpen(false);
        successToast(`Exporting employee salary list as ${format}...`);
    };

    return (
        <div className="admin-dash">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 md:text-2xl mb-6">Payroll </h1>

                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setExportOpen((open) => !open)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Download size={16} />
                            Export
                            <ChevronDown size={14} />
                        </button>
                        {exportOpen && (
                            <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => handleExport("CSV")}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Export as CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleExport("PDF")}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Export as PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setSalaryModal({})}
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                        <Plus size={16} />
                        Add Salary
                    </button>
                </div>
            </div>

            <div className="admin-dash-card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search employee..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
                            />
                        </div>
                        <select
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
                        >
                            <option value="">All Designations</option>
                            {designations.map((d) => (
                                <option key={d.designation_id} value={d.designation_id}>
                                    {d.designation_name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>



                <div className="mt-4 overflow-x-auto">
                    <table className="admin-att-table w-full min-w-[1100px]">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                                </th>
                                <th>Emp ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Designation</th>
                                <th>Joining Date</th>
                                <th>Salary</th>
                                <th>Payslip</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-8 text-center text-gray-500">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                visibleEmployees.map((emp) => (
                                    <tr key={emp.employee_id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(emp.employee_id)}
                                                onChange={() => toggleSelectOne(emp.employee_id)}
                                            />
                                        </td>
                                        <td className="font-medium text-gray-700">
                                            Emp-{String(emp.employee_id).padStart(3, "0")}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <span className="admin-emp-avatar">{getInitials(emp.first_name, emp.lasst_name)}</span>
                                                <div>
                                                    <p className="font-medium text-gray-800">{getFullName(emp)}</p>
                                                    <p className="text-xs text-gray-400">{designationName(emp.designationId)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-gray-500">{emp.email}</td>
                                        <td className="text-gray-500">{emp.mobile}</td>
                                        <td>
                                            <select
                                                value={emp.designationId}
                                                onChange={(e) => handleDesignationChange(emp.employee_id, e.target.value)}
                                                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600"
                                            >
                                                {designations.map((d) => (
                                                    <option key={d.designation_id} value={d.designation_id}>
                                                        {d.designation_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-gray-500">{formatDate(emp.emp_joining_date)}</td>
                                        <td className="font-medium text-gray-700">{formatCurrency(emp.salary)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => setSlipEmployee(emp)}
                                                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                                            >
                                                Generate Slip
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSalaryModal({ employeeId: String(emp.employee_id), salary: String(emp.salary) })
                                                }
                                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                aria-label={`Edit salary for ${getFullName(emp)}`}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                    Showing {visibleEmployees.length} of {filteredEmployees.length} entries
                </p>
            </div>

            <div className="mt-4 flex justify-end">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Row Per Page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600"
                    >
                        {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                    <span>Entries</span>
                </div>


            </div>

            {slipEmployee && (
                <PayslipModal
                    employee={slipEmployee}
                    designationLabel={designationName(slipEmployee.designationId)}
                    onClose={() => setSlipEmployee(null)}
                />
            )}

            {salaryModal && (
                <AddSalaryModal
                    employees={employees}
                    designations={designations}
                    initial={salaryModal}
                    onClose={() => setSalaryModal(null)}
                    onSave={handleSaveSalary}
                />
            )}
        </div>
    );
};

export default PayRollForm;


export const formatCurrency = (value) =>
{
    if (value === "" || value == null || Number.isNaN(Number(value))) return "—";
    return `₹ ${Number(value).toLocaleString()}`;
};
export const calculatePayslip = (grossSalary) =>
{
    const gross = Number(grossSalary) || 0;

    const basic = Math.round(gross * 0.5);

    const hra = Math.round(basic * 0.4);

    const conveyance = 1600;

    const medicalAllowance = 1250;

    const specialAllowance =
        gross -
        (
            basic +
            hra +
            conveyance +
            medicalAllowance
        );

    // Deductions
    const pf = Math.round(basic * 0.12);

    const esi =
        gross <= 21000
            ? Math.round(gross * 0.0075)
            : 0;

    const professionalTax = 200;

    const tds = 0;

    const totalEarnings =
        basic +
        hra +
        conveyance +
        medicalAllowance +
        specialAllowance;

    const totalDeductions =
        pf +
        esi +
        professionalTax +
        tds;

    const netSalary = Math.max(
        0,
        totalEarnings - totalDeductions
    );

    return {
        gross,

        basic,
        hra,
        conveyance,
        medicalAllowance,
        specialAllowance,

        pf,
        esi,
        professionalTax,
        tds,

        totalEarnings,
        totalDeductions,
        netSalary,
    };
};

