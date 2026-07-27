import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  computeCTC, createStructure, getStructure,
  listComponents, removeStructureLine, updateStructure,
} from "../../../../api/salaryComponent.api";
import { getErrorMessage } from "../../../../api/client";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { PREVIEW_CTC } from "../constants";
import { executePanelSave } from "../utils/panelSave";

export default function useSalaryStructure() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [structure, setStructure] = useState(null);
  const [masterComps, setMasterComps] = useState([]);
  const [activeTab, setActiveTab] = useState("fixed");
  const [computed, setComputed] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editLine, setEditLine] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const computeTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mc = await listComponents(null);
      setMasterComps(mc ?? []);
      if (!isNew) {
        const s = await getStructure(id);
        setStructure(s);
        setDraftName(s.structure_name);
      } else {
        const blank = {
          structure_id: null,
          structure_name: "New Salary Structure",
          description: "",
          is_default: false,
          lines: [],
        };
        setStructure(blank);
        setDraftName(blank.structure_name);
      }
    } catch {
      errorToast("Failed to load structure");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!structure?.structure_id) return;
    clearTimeout(computeTimer.current);
    computeTimer.current = setTimeout(async () => {
      try { setComputed(await computeCTC(structure.structure_id, PREVIEW_CTC * 12)); } catch {}
    }, 500);
    return () => clearTimeout(computeTimer.current);
  }, [structure?.structure_id, structure?.lines]);

  const saveMeta = useCallback(async (patch = {}) => {
    const payload = {
      structure_name: draftName,
      description: structure.description,
      is_default: structure.is_default,
      lines: [],
      ...patch,
    };
    if (isNew && !structure.structure_id) {
      const created = await createStructure(payload);
      navigate(`/dashboard/salary-structures/${created.structure_id}`, { replace: true });
      return created;
    }
    return await updateStructure(structure.structure_id, payload);
  }, [draftName, isNew, navigate, structure]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveMeta();
      setStructure((prev) => ({ ...prev, structure_name: draftName }));
      successToast("Structure saved");
      if (!isNew) await load();
    } catch (err) {
      errorToast(getErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }, [draftName, isNew, load, saveMeta]);

  const handlePanelSave = useCallback(async (data) => {
    await executePanelSave({
      data, structure, setStructure, saveMeta, load, setPanelOpen, setEditLine,
    });
  }, [load, saveMeta, structure]);

  const handleRemoveLine = useCallback(async (line) => {
    if (!window.confirm(`Remove "${line.component_name}" from this structure?`)) return;
    try {
      await removeStructureLine(structure.structure_id, line.component_id);
      successToast("Component removed");
      await load();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to remove"));
    }
  }, [load, structure]);

  const openAdd = useCallback(() => { setEditLine(null); setPanelOpen(true); }, []);
  const openEdit = useCallback((line) => { setEditLine(line); setPanelOpen(true); }, []);
  const closePanel = useCallback(() => { setPanelOpen(false); setEditLine(null); }, []);

  return {
    id, isNew, structure, setStructure,
    masterComps, activeTab, setActiveTab,
    computed, panelOpen, editLine,
    saving, loading, editingName, setEditingName,
    draftName, setDraftName,
    handleSave, handlePanelSave, handleRemoveLine,
    openAdd, openEdit, closePanel,
  };
}
