import { useMemo, useState } from "react";
import { calculatePayslip } from "./PayRollForm";
import SalaryComponentModal from "./SalaryComponentModal";

const AddSalaryModal = ({ employees, designations, initial, onClose, onSave }) =>
{
    const lockEmployee = Boolean(initial?.employeeId);
    const [showComponentModal, setShowComponentModal] = useState(false);

    const [customComponents, setCustomComponents] = useState([]);
    const [employeeId, setEmployeeId] = useState(
        initial?.employeeId || ""
    );

    const [salary, setSalary] = useState(
        initial?.salary || ""
    );

    const breakdown = useMemo(
        () => calculatePayslip(salary),
        [salary]
    );
    const selectedEmployee = employees.find((emp) => String(emp.employee_id) === String(employeeId));
    const designationLabel = selectedEmployee
        ? designations.find((d) => d.designation_id === selectedEmployee.designation_id)?.designation_name
        : null;

    const handleSubmit = () =>
    {
        if (!employeeId)
        {
            window.alert("Please select an employee.");
            return;
        }
        if (!salary || Number(salary) <= 0)
        {
            window.alert("Please enter a valid salary.");
            return;
        }
        onSave(employeeId, Number(salary));
    };

    const evaluateFormula = (
        formula,
        context
    ) =>
    {
        try
        {
            let expression = formula;

            Object.entries(context).forEach(
                ([key, value]) =>
                {
                    expression =
                        expression.replaceAll(
                            key,
                            value
                        );
                }
            );

            const result =
                Function(
                    `return ${expression}`
                )();

            return Math.max(
                0,
                Math.round(result)
            );
        }
        catch
        {
            return 0;
        }
    };
    const formulaContext = {
        basic: breakdown.basic,
        hra: breakdown.hra,
        conveyance: breakdown.conveyance,
        medicalAllowance: breakdown.medicalAllowance,
        specialAllowance: breakdown.specialAllowance,
        gross: breakdown.gross,

        pf: breakdown.pf,
        esi: breakdown.esi,
        professionalTax: breakdown.professionalTax,
        tds: breakdown.tds
    };

    const calculatedComponents = customComponents.map(
        component => ({
            ...component,
            amount: Math.max(
                0,
                evaluateFormula(
                    component.formula,
                    formulaContext
                )
            )
        })
    );
    const customEarnings = calculatedComponents
        .filter(c => c.type === "earning")
        .reduce((sum, c) => sum + c.amount, 0);

    const customDeductions = calculatedComponents
        .filter(c => c.type === "deduction")
        .reduce((sum, c) => sum + c.amount, 0);

        const totalEarnings =
    breakdown.totalEarnings + customEarnings;

const totalDeductions =
    breakdown.totalDeductions + customDeductions;

const netSalary = Math.max(
    0,
    totalEarnings - totalDeductions
);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40  items-center justify-center flex">
            <div className="w-full max-w-2xl  rounded-md bg-white shadow-xl flex flex-col p-8 ">
                <div className="flex items-center justify-between border-b  py-4">
                    <h2 className="text-2xl font-semibold text-slate-800">
                        Edit Employee Salary
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="h-[60vh] overflow-auto mt-4" >

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                        <div>
                            <label className="mb-2 block text-sm">
                                Employee Name
                            </label>

                            <select
                                value={employeeId}
                                disabled={lockEmployee}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="w-full rounded border p-1"
                            >
                                <option value="">Select Employee</option>

                                {employees.map((emp) => (
                                    <option
                                        key={emp.employee_id}
                                        value={emp.employee_id}
                                    >
                                        {emp.first_name} {emp.lasst_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm">
                                Gross Salary
                            </label>

                            <input
                                type="number"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                                className="w-full rounded border p-1"
                            />
                        </div>

                    </div>


                    <div className="mt-3">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-2xl font-semibold">
                                Earnings
                            </h3>

                            <button
                                type="button"
                                onClick={() => setShowComponentModal(true)}
                                className="rounded bg-orange-500 px-3 py-2 text-sm text-white"
                            >
                                + Add New
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                            <div>
                                <label className="mb-2 block font-medium">
                                    Basic (50%)
                                </label>
                                <input
                                    readOnly
                                    value={breakdown.basic}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    HRA (40% of Basic)
                                </label>
                                <input
                                    readOnly
                                    value={breakdown.hra}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    Conveyance
                                </label>
                                <input
                                    readOnly
                                    value={breakdown.conveyance}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    Medical Allowance
                                </label>
                                <input
                                    readOnly
                                    value={breakdown.medicalAllowance}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    Special Allowance
                                </label>
                                <input
                                    readOnly
                                    value={breakdown.specialAllowance}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    Total Earnings
                                </label>
                                <input
                                    readOnly
                                    value={totalEarnings}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>
                            {calculatedComponents
                                .filter(c => c.type === "earning")
                                .map(component => (
                                    <div key={component.id}>
                                        <label className="mb-2 block font-medium">
                                            {component.name}
                                        </label>

                                        <input
                                            readOnly
                                            value={component.amount}
                                            className="w-full rounded border bg-gray-100 p-1"
                                        />
                                    </div>
                                ))}

                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-gray-500">
                                Gross Salary
                            </p>

                            <p className="text-xl font-bold">
                                ₹ {breakdown.gross.toLocaleString()}
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-gray-500">
                                Total Deductions
                            </p>

                            <p className="text-xl font-bold text-red-600">
                                ₹ {totalDeductions.toLocaleString()}
                            </p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-4">
                            <p className="text-sm text-gray-500">
                                Net Salary
                            </p>

                            <p className="text-2xl font-bold text-green-600">
                                ₹ {netSalary.toLocaleString()}
                            </p>
                        </div>

                    </div>

                    <div className="mt-3">
                        <h3 className="mb-6 text-2xl font-semibold">
                            Deductions
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

                            <div>
                                <label className="mb-2 block font-medium">
                                    PF (12%)
                                </label>

                                <input
                                    readOnly
                                    value={breakdown.pf}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    ESI
                                </label>

                                <input
                                    readOnly
                                    value={breakdown.esi}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    Professional Tax
                                </label>

                                <input
                                    readOnly
                                    value={breakdown.professionalTax}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-medium">
                                    TDS
                                </label>

                                <input
                                    readOnly
                                    value={breakdown.tds}
                                    className="w-full rounded border bg-gray-100 p-1"
                                />
                            </div>
                            {calculatedComponents
                                .filter(c => c.type === "deduction")
                                .map(component => (
                                    <div key={component.id}>
                                        <label className="mb-2 block font-medium">
                                            {component.name}
                                        </label>

                                        <input
                                            readOnly
                                            value={component.amount}
                                            className="w-full rounded border bg-gray-100 p-1"
                                        />
                                    </div>
                                ))}
                        </div>

                    </div>


                </div>
                <div className=" flex justify-end gap-4 border-t mt-4">
                    <button
                        onClick={onClose}
                        className="rounded border px-8 py-3 font-medium mt-3"
                    >
                        Cancel
                    </button>


                    <button
                        onClick={handleSubmit}
                        className="rounded bg-orange-500 px-8 py-1 font-medium text-white hover:bg-orange-600 mt-3"
                    >
                        Save Salary
                    </button>
                </div>
            </div>
            {showComponentModal && (
                <SalaryComponentModal
                    onClose={() => setShowComponentModal(false)}
                    onSave={(component) =>
                    {
                        const amount = evaluateFormula(
                            component.formula,
                            formulaContext
                        );

                        setCustomComponents(prev => [
                            ...prev,
                            {
                                ...component,
                                id: Date.now()
                            }
                        ]);

                        setShowComponentModal(false);
                    }}
                />
            )}
        </div>
    );
};
export default AddSalaryModal;