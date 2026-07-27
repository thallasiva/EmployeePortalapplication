import { useState, useEffect, useCallback, useMemo } from "react";
import {
  listComponents,
  createComponent,
  updateComponent,
  toggleComponent,
} from "../../../../api/salaryComponent.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { getErrorMessage } from "../../../../api/client";
import { CATEGORIES } from "../constants";

export function useSalaryComponents() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setComponents(await listComponents(null));
    } catch {
      errorToast("Failed to load components");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      components.filter((c) => {
        if (!showInactive && !c.is_active) return false;
        if (catFilter && c.category !== catFilter) return false;
        if (
          search &&
          !c.component_name.toLowerCase().includes(search.toLowerCase()) &&
          !c.component_code.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [components, showInactive, catFilter, search]
  );

  const grouped = useMemo(
    () =>
      CATEGORIES.reduce((acc, cat) => {
        acc[cat] = filtered.filter((c) => c.category === cat);
        return acc;
      }, {}),
    [filtered]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((c) => {
    setEditing(c);
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
          await updateComponent(editing.component_id, data);
          successToast("Component updated");
        } else {
          await createComponent(data);
          successToast("Component added");
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

  const handleToggle = useCallback(
    async (c) => {
      try {
        await toggleComponent(c.component_id, !c.is_active);
        successToast(c.is_active ? "Component deactivated" : "Component activated");
        load();
      } catch (err) {
        errorToast(getErrorMessage(err, "Failed"));
      }
    },
    [load]
  );

  return {
    components,
    loading,
    search,
    setSearch,
    catFilter,
    setCat,
    showInactive,
    setShowInactive,
    filtered,
    grouped,
    formOpen,
    editing,
    saving,
    openCreate,
    openEdit,
    closeForm,
    handleSave,
    handleToggle,
  };
}
