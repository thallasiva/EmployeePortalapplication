import { useState, useEffect, useCallback } from "react";
import {
  listStructures,
  createStructure,
  updateStructure,
  listComponents,
} from "../../../../api/salaryComponent.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { getErrorMessage } from "../../../../api/client";

export function useSalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [allComponents, setAllComp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([listStructures(), listComponents(null)]);
      setStructures(s);
      setAllComp(c);
    } catch {
      errorToast("Failed to load structures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((s) => {
    setEditing(s);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const handleSave = useCallback(
    async (data) => {
      setSaving(true);
      try {
        if (editing) {
          await updateStructure(editing.structure_id, { ...data, lines: [] });
          successToast("Structure updated");
        } else {
          await createStructure({ ...data, lines: [] });
          successToast("Structure created");
        }
        closeForm();
        load();
      } catch (err) {
        errorToast(getErrorMessage(err, "Failed to save"));
      } finally {
        setSaving(false);
      }
    },
    [editing, closeForm, load]
  );

  return {
    structures,
    allComponents,
    loading,
    formOpen,
    editing,
    saving,
    openCreate,
    openEdit,
    closeForm,
    handleSave,
    load,
  };
}
