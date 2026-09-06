import { getApiError, ERR } from "../../../../utils/toastMessages";
import { apiErrorToast } from "../../../../utils/ToastControllers";
import { useState, useCallback, useEffect } from "react";
import { listPayslips, runPayroll, listPayrollRuns } from "../../../../api/payroll.api";
import { listEmployees } from "../../../../api/employee.api";
import { listAttendance } from "../../../../api/attendance.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { MONTHS } from "../constants";

export function usePayrollData(selected) {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, emps, attendance, rs] = await Promise.all([
        listPayslips({ month: selected.month, year: selected.year, limit: 500 }),
        listEmployees({ status: "Active", limit: 500 }),
        listAttendance({
          from_date: `${selected.year}-${String(selected.month).padStart(2, "0")}-01`,
          to_date: new Date(selected.year, selected.month, 0).toISOString().slice(0, 10),
          limit: 10000,
        }),
        listPayrollRuns({ year: selected.year, limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setPayslips(ps.data || []);
      setEmployees(emps.data || []);
      setAttendanceRows(attendance.data || []);
      setRuns(rs.data || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [selected.month, selected.year]);

  useEffect(() => { load(); }, [load]);

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    try {
      await runPayroll({ month: selected.month, year: selected.year });
      successToast(`✅ Payroll processed for ${MONTHS[selected.month - 1]} ${selected.year}. Payslips are ready for review.`);
      load();
    } catch (e) {
      apiErrorToast(e, "process payroll");
    } finally {
      setProcessing(false);
    }
  }, [selected, load]);

  return { payslips, employees, attendanceRows, runs, loading, processing, handleProcess, load };
}
