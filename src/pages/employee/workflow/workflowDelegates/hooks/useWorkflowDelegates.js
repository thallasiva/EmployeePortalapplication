import { useEffect, useState, useCallback } from "react";
import { listEmployees } from "../../../../../api/employee.api";
import { getStoredUser } from "../../../../../data/auth";
import { successToast } from "../../../../../utils/ToastControllers";
import { WORKFLOWS } from "../constants";
import { delegateStatus } from "../utils";

export function useWorkflowDelegates() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delegates, setDelegates] = useState({});
  const [saving, setSaving] = useState(false);
  const [oooFrom, setOooFrom] = useState("");
  const [oooTo, setOooTo] = useState("");
  const [oooEnabled, setOooEnabled] = useState(false);

  const user = getStoredUser();
  const myId = user?.employeeId;

  useEffect(() => {
    listEmployees({ limit: 500 })
      .then((res) => setEmployees(res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const applyOoo = useCallback(() => {
    if (!oooFrom || !oooTo) return;
    setDelegates((prev) => {
      const next = { ...prev };
      WORKFLOWS.forEach((wf) => {
        if (next[wf.id]?.delegateId) {
          next[wf.id] = { ...next[wf.id], from: oooFrom, to: oooTo };
        }
      });
      return next;
    });
    successToast("OOO dates applied to all configured delegates.");
  }, [oooFrom, oooTo]);

  const handleChange = useCallback((wfId, field, value) => {
    setDelegates((prev) => ({
      ...prev,
      [wfId]: {
        delegateId: prev[wfId]?.delegateId ?? "",
        from: prev[wfId]?.from ?? "",
        to: prev[wfId]?.to ?? "",
        [field]: value,
      },
    }));
  }, []);

  const handleRemove = useCallback((wfId) => {
    setDelegates((prev) => {
      const next = { ...prev };
      delete next[wfId];
      return next;
    });
  }, []);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    const count = Object.values(delegates).filter((d) => d.delegateId).length;
    successToast(
      count > 0
        ? `${count} workflow delegate${count > 1 ? "s" : ""} saved successfully.`
        : "Delegate settings cleared."
    );
  }, [delegates]);

  const activeDelegates = Object.values(delegates).filter((d) => {
    const s = delegateStatus(d?.from, d?.to);
    return d?.delegateId && s === "active";
  }).length;

  const configuredCount = Object.values(delegates).filter((d) => d?.delegateId).length;

  return {
    employees, loading, delegates, saving,
    oooFrom, oooTo, oooEnabled,
    setOooFrom, setOooTo, setOooEnabled,
    myId, activeDelegates, configuredCount,
    applyOoo, handleChange, handleRemove, handleSaveAll,
  };
}
