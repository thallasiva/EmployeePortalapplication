import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getOrgStats, getOrgTree, getUnassigned, getManagers,
  getManagerDetails, searchOrg, assignManager, bulkAssign,
  transferManager, listDelegations, createDelegation,
  cancelDelegation, getReportingHistory,
} from "../../../../api/orgHierarchy.api";
import { apiErrorToast, errorToast, successToast } from "../../../../utils/ToastControllers";

const filterTree = (nodes, q) => {
  if (!q) return nodes;
  const low = q.toLowerCase();
  const filterNode = (node) => {
    const match =
      node.name?.toLowerCase().includes(low) ||
      node.designation?.toLowerCase().includes(low);
    const filteredChildren = (node.children || []).map(filterNode).filter(Boolean);
    if (match || filteredChildren.length > 0) return { ...node, children: filteredChildren };
    return null;
  };
  return nodes.map(filterNode).filter(Boolean);
};

export function useWorkflowData(activeTab) {
  const [stats, setStats] = useState(null);
  const [tree, setTree] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [managers, setManagers] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [history, setHistory] = useState([]);
  const [histPage] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [highlightIds, setHighlightIds] = useState(new Set());
  const [focusedPath, setFocusedPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignMap, setAssignMap] = useState({});
  const [saving, setSaving] = useState({});
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkManager, setBulkManager] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [xferOldMgr, setXferOldMgr] = useState(null);
  const [xferNewMgr, setXferNewMgr] = useState(null);
  const [xferReason, setXferReason] = useState("");
  const [xferTeam, setXferTeam] = useState([]);
  const [xferSaving, setXferSaving] = useState(false);
  const [delForm, setDelForm] = useState({
    employee_id: null, delegate_employee_id: null,
    module: "all", from_date: "", to_date: "", reason: "",
  });
  const [delSaving, setDelSaving] = useState(false);
  const [deptFilter] = useState("");
  const [mgSearch, setMgSearch] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, u, d] = await Promise.all([
        getOrgStats(), getManagers(), getUnassigned(), listDelegations(),
      ]);
      setStats(s);
      setManagers(Array.isArray(m) ? m : []);
      setUnassigned(Array.isArray(u) ? u : []);
      setDelegations(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }, []);

  const loadTree = useCallback(async () => {
    try {
      const t = await getOrgTree(deptFilter ? { department_id: deptFilter } : {});
      setTree(Array.isArray(t) ? t : []);
    } catch (e) {
      apiErrorToast(e, "load delegation hierarchy");
      setTree([]);
    }
  }, [deptFilter]);

  const loadHistory = useCallback(async () => {
    const r = await getReportingHistory({ page: histPage, limit: 50 });
    setHistory(Array.isArray(r) ? r : []);
  }, [histPage]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "hierarchy") loadTree();
  }, [activeTab, loadTree]);

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab, loadHistory]);

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchOrg({ q: searchQ });
        setSearchResults(Array.isArray(r) ? r : []);
      } catch {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    if (!xferOldMgr) { setXferTeam([]); return; }
    getManagerDetails(xferOldMgr)
      .then((d) => setXferTeam(d?.direct_reports || []))
      .catch(() => setXferTeam([]));
  }, [xferOldMgr]);

  const handleAssign = useCallback(async (empId) => {
    const mgr = assignMap[empId];
    if (!mgr) return;
    setSaving((s) => ({ ...s, [empId]: true }));
    try {
      await assignManager({ employee_id: empId, new_manager_id: mgr });
      successToast("Manager assigned successfully");
      setUnassigned((u) => u.filter((e) => e.employee_id !== empId));
      setStats((s) => s ? { ...s, without_manager: Math.max(0, s.without_manager - 1) } : s);
      await loadAll();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Assignment failed");
    }
    setSaving((s) => { const n = { ...s }; delete n[empId]; return n; });
  }, [assignMap, loadAll]);

  const handleBulkAssign = useCallback(async () => {
    if (!bulkSelected.length || !bulkManager) return;
    setBulkSaving(true);
    try {
      const r = await bulkAssign({ employee_ids: bulkSelected, new_manager_id: bulkManager });
      successToast(`${r.transferred} employees assigned`);
      setBulkSelected([]);
      setBulkManager(null);
      await loadAll();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Bulk assign failed");
    }
    setBulkSaving(false);
  }, [bulkSelected, bulkManager, loadAll]);

  const handleTransfer = useCallback(async () => {
    if (!xferOldMgr || !xferNewMgr) return;
    setXferSaving(true);
    try {
      const r = await transferManager({
        old_manager_id: xferOldMgr,
        new_manager_id: xferNewMgr,
        reason: xferReason,
      });
      successToast(`${r.transferred} employees transferred`);
      setXferOldMgr(null);
      setXferNewMgr(null);
      setXferReason("");
      setXferTeam([]);
      await loadAll();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Transfer failed");
    }
    setXferSaving(false);
  }, [xferOldMgr, xferNewMgr, xferReason, loadAll]);

  const handleCreateDelegation = useCallback(async () => {
    const { employee_id, delegate_employee_id, from_date, to_date } = delForm;
    if (!employee_id || !delegate_employee_id || !from_date || !to_date) {
      errorToast("All required fields must be filled");
      return;
    }
    setDelSaving(true);
    try {
      await createDelegation(delForm);
      successToast("Delegation created");
      setDelForm({ employee_id: null, delegate_employee_id: null, module: "all", from_date: "", to_date: "", reason: "" });
      const d = await listDelegations();
      setDelegations(Array.isArray(d) ? d : []);
    } catch (e) {
      apiErrorToast(e, "create delegation");
    }
    setDelSaving(false);
  }, [delForm]);

  const handleCancelDelegation = useCallback(async (id) => {
    try {
      await cancelDelegation(id);
      successToast("Delegation cancelled");
      const d = await listDelegations();
      setDelegations(Array.isArray(d) ? d : []);
    } catch (e) {
      apiErrorToast(e, "cancel delegation");
    }
  }, []);

  const visibleTree = useMemo(() => filterTree(tree, treeSearch), [tree, treeSearch]);

  return {
    stats, tree, unassigned, managers, delegations, history, loading,
    searchQ, setSearchQ, searchResults, searching,
    treeSearch, setTreeSearch, highlightIds, setHighlightIds,
    focusedPath, setFocusedPath, visibleTree,
    assignMap, setAssignMap, saving,
    bulkSelected, setBulkSelected, bulkManager, setBulkManager, bulkSaving,
    xferOldMgr, setXferOldMgr, xferNewMgr, setXferNewMgr,
    xferReason, setXferReason, xferTeam, xferSaving,
    delForm, setDelForm, delSaving,
    mgSearch, setMgSearch,
    loadAll, loadTree,
    handleAssign, handleBulkAssign, handleTransfer,
    handleCreateDelegation, handleCancelDelegation,
  };
}
