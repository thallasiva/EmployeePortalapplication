import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { fieldOptionsApi } from "../../../../api/settings.api";
import { createDepartment, listDepartments } from "../../../../api/department.api";
import { apiErrorToast } from "../../../../utils/ToastControllers";

const CATEGORIES = [
  { key: "blood_group", label: "Blood groups" },
  { key: "marital_status", label: "Marital status" },
  { key: "employee_type", label: "Employment types" },
  { key: "employee_status", label: "Employee statuses" },
  { key: "bgv_status", label: "BGV statuses" },
];

export default function FieldOptionsManager() {
  const [options, setOptions] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [departmentSaving, setDepartmentSaving] = useState(false);

  useEffect(() => {
    fieldOptionsApi.list()
      .then(setOptions)
      .catch((error) => {
        setLoadError(true);
        apiErrorToast(error, "Failed to load employee field options");
      })
      .finally(() => setLoading(false));
    listDepartments()
      .then(setDepartments)
      .catch((error) => apiErrorToast(error, "Failed to load departments"))
      .finally(() => setDepartmentLoading(false));
  }, []);

  const addOption = async (fieldKey) => {
    const value = (values[fieldKey] || "").trim();
    if (!value) return;
    setSavingKey(fieldKey);
    try {
      const option = await fieldOptionsApi.create({ field_key: fieldKey, value });
      setOptions((current) => [
        ...current.filter((item) => item.id !== option.id),
        option,
      ]);
      setValues((current) => ({ ...current, [fieldKey]: "" }));
    } catch (error) {
      apiErrorToast(error, "Failed to add field option");
    } finally {
      setSavingKey("");
    }
  };

  const removeOption = async (option) => {
    if (!window.confirm(`Remove "${option.label}" from ${option.field_key.replace(/_/g, " ")}?`)) return;
    setSavingKey(option.field_key);
    try {
      await fieldOptionsApi.delete(option.id);
      setOptions((current) => current.filter((item) => item.id !== option.id));
    } catch (error) {
      apiErrorToast(error, "Failed to remove field option");
    } finally {
      setSavingKey("");
    }
  };

  const addDepartment = async (event) => {
    event.preventDefault();
    const name = departmentName.trim();
    if (!name) return;
    setDepartmentSaving(true);
    try {
      const department = await createDepartment({ department_name: name });
      setDepartments((current) => [...current, department]);
      setDepartmentName("");
    } catch (error) {
      apiErrorToast(error, "Failed to add department");
    } finally {
      setDepartmentSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold  text-[#f18200]">Employee field options</h2>
      <p className="mt-1 text-sm text-gray-500">
        Manage the choices available in employee profiles and onboarding forms, including departments.
      </p>
      <div className="mt-5 rounded-xl border border-gray-100 p-4">
        <h3 className="font-medium text-slate-800">Departments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Departments are shared across employee profiles and use database records.
        </p>
        {departmentLoading ? (
          <p className="mt-3 text-sm text-gray-500">Loading departments…</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {departments.map((department) => (
                <span key={department.department_id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-slate-700">
                  {department.department_name}
                </span>
              ))}
              {!departments.length && (
                <span className="text-sm text-gray-400">No departments configured</span>
              )}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={addDepartment}>
              <input
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
                maxLength={100}
                aria-label="New department name"
                placeholder="Add department"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={departmentSaving || !departmentName.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Plus size={15} /> {departmentSaving ? "Adding…" : "Add"}
              </button>
            </form>
          </>
        )}
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-gray-500">Loading options…</p>
      ) : loadError ? (
        <p role="alert" className="mt-5 text-sm text-red-600">
          Unable to load saved field options. Refresh this page before managing them.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {CATEGORIES.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-gray-100 p-4">
              <h3 className="font-medium text-slate-800">{label}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {options.filter((option) => option.field_key === key).map((option) => (
                  <span key={option.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-slate-700">
                    {option.label}
                    <button
                      type="button"
                      aria-label={`Remove ${option.label}`}
                      disabled={savingKey === key}
                      onClick={() => removeOption(option)}
                      className="ml-1 rounded p-0.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
                {!options.some((option) => option.field_key === key) && (
                  <span className="text-sm text-gray-400">No options configured</span>
                )}
              </div>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  addOption(key);
                }}
              >
                <input
                  value={values[key] || ""}
                  onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                  maxLength={100}
                  aria-label={`New ${label.toLowerCase()} option`}
                  placeholder={`Add ${label.toLowerCase().replace(/s$/, "")}`}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={savingKey === key || !(values[key] || "").trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Plus size={15} /> Add
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
