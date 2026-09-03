import { useState, useEffect, useCallback } from "react";
import {
  listJoiningInvitations,
  getJoiningDetail,
  reviewJoiningFormality,
  resendJoiningInvitation,
} from "../../../../api/joining.api";
import { listEmployees } from "../../../../api/employee.api";
import { apiErrorToast, successToast, errorToast } from "../../../../utils/ToastControllers";

export function useJoiningVerification() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [adminFields, setAdminFields] = useState({
    employeeId: "",
    designation: "",
    reportingTo: "",
    department: "",
  });
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 })
      .then((res) => {
        const all = res.data ?? [];
        const mgrs = all.filter((e) => Number(e.role_id) === 3);
        const src = mgrs.length > 0 ? mgrs : all;
        setManagers(
          src.map((e) => ({
            value: `${e.first_name}${e.last_name ? " " + e.last_name : ""}`,
            label: `${e.first_name}${e.last_name ? " " + e.last_name : ""} (${e.emp_code || ""})`,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    listJoiningInvitations({ status: filter === "all" ? undefined : filter, limit: 100 })
      .then((r) => setRows(r.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = useCallback(async (id, row) => {
    setDetailId(id);
    setDetail(null);
    setSelectedRow(row || null);
    setRemarks("");
    setDecision(null);
    setAdminFields({ employeeId: "", designation: "", reportingTo: "", department: "" });
    try {
      const d = await getJoiningDetail(id);
      setDetail(d);
      setAdminFields({
        employeeId: d.admin_employee_id || "",
        designation: d.admin_designation || "",
        reportingTo: d.admin_reporting_to || "",
        department: d.admin_department || "",
      });
    } catch (e) {
      apiErrorToast(e, "load joining details");
    }
  }, []);

  const submitReview = useCallback(async () => {
    if (!decision) return;
    setReviewing(true);
    try {
      await reviewJoiningFormality(detailId, { decision, remarks, ...adminFields });
      successToast("Decision submitted");
      setDetailId(null);
      setDetail(null);
      setSelectedRow(null);
      load();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Review failed");
    } finally {
      setReviewing(false);
    }
  }, [decision, detailId, remarks, adminFields, load]);

  const saveAdminFieldsOnly = useCallback(async () => {
    setReviewing(true);
    try {
      const updated = await reviewJoiningFormality(detailId, {
        decision: detail.formality_status === "rejected" ? "reject" : "approve",
        remarks: detail.hr_remarks || "",
        ...adminFields,
      });
      setDetail((prev) => ({
        ...prev,
        ...updated,
        admin_employee_id: adminFields.employeeId || prev.admin_employee_id,
        admin_designation: adminFields.designation || prev.admin_designation,
        admin_reporting_to: adminFields.reportingTo || prev.admin_reporting_to,
        admin_department: adminFields.department || prev.admin_department,
      }));
      successToast("Employee details saved");
      load();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Save failed");
    } finally {
      setReviewing(false);
    }
  }, [detailId, detail, adminFields, load]);

  const resend = useCallback(async (id) => {
    try {
      await resendJoiningInvitation(id);
      successToast("Invitation resent");
    } catch (e) {
      apiErrorToast(e, "resend invitation");
    }
  }, []);

  const updateAdminField = useCallback((e) => {
    setAdminFields((p) => ({ ...p, [e.target.name]: e.target.value }));
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    setDetail(null);
    setSelectedRow(null);
  }, []);

  return {
    rows,
    loading,
    filter,
    setFilter,
    detail,
    detailId,
    selectedRow,
    remarks,
    setRemarks,
    decision,
    setDecision,
    reviewing,
    adminFields,
    managers,
    load,
    openDetail,
    submitReview,
    saveAdminFieldsOnly,
    resend,
    updateAdminField,
    closeDetail,
  };
}
