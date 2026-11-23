import { useCallback, useEffect, useState } from "react";
import { listEmployees } from "../../../../api/employee.api";
import { listAssetAllocations, listAssetCategories } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const panelClass = "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";
const blankAsset = {
  asset_tag: "",
  asset_name: "",
  category_id: "",
  serial_number: "",
  location: "",
  purchase_date: "",
  notes: ""
};
const listAllAssetCategories = () => listAssetCategories();
const listActiveAssetCategories = () => listAssetCategories(false);
const listAllocations = () => listAssetAllocations();
function dateLabel(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const escape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [columns.map(escape).join(","), ...rows.map(row => columns.map(column => escape(row[column])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], {
    type: "text/csv;charset=utf-8"
  }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function usePageData(loader) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows((await loader()) || []);
    } catch (cause) {
      setError(getErrorMessage(cause, "Unable to load asset data."));
    } finally {
      setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return {
    rows,
    setRows,
    loading,
    error,
    refresh
  };
}
function useEmployees() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    listEmployees({
      limit: 1000,
      status: "Active"
    }).then(result => setRows(result?.data || [])).catch(cause => setError(getErrorMessage(cause, "Unable to load employees.")));
  }, []);
  return {
    employees: rows,
    employeeError: error
  };
}
export { fieldClass, panelClass, blankAsset, listAllAssetCategories, listActiveAssetCategories, listAllocations, dateLabel, downloadCsv, usePageData, useEmployees };
