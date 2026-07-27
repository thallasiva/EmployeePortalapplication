import { useCallback, useEffect, useState } from "react";
import {
  listSalaryTemplates, createSalaryTemplate,
  updateSalaryTemplate, deleteSalaryTemplate
} from "../../../../api/salaryTemplate.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { getErrorMessage } from "../../../../api/client";

export function useSalaryTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTemplates(await listSalaryTemplates()); }
    catch { errorToast("Failed to load templates"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveTemplate = useCallback(async (data, editing, onSuccess) => {
    setSaving(true);
    try {
      if (editing) {
        await updateSalaryTemplate(editing.template_id, data);
        successToast("Template updated");
      } else {
        await createSalaryTemplate(data);
        successToast("Template created");
      }
      onSuccess();
      load();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to save template"));
    } finally { setSaving(false); }
  }, [load]);

  const deleteTemplate = useCallback(async (t) => {
    if (!window.confirm(`Delete "${t.template_name}"?`)) return;
    try {
      await deleteSalaryTemplate(t.template_id);
      successToast("Template deleted");
      load();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to delete"));
    }
  }, [load]);

  return { templates, loading, saving, saveTemplate, deleteTemplate };
}
