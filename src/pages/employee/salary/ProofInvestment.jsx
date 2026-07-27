import React, { useEffect, useState, useCallback } from "react";
import { Upload, CheckCircle2, Clock, XCircle, Trash2, Download, AlertCircle, Lock, RefreshCw } from "lucide-react";
import { getMyITDeclaration, getMyProofs, uploadProof, deleteProof, downloadProofUrl } from "../../../api/itDeclaration.api";import { cssClass, joinClasses } from "../../../utils/classStyles";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const STATUS_CFG = {
  verified: { bg: "#dcfce7", color: "#15803d", icon: <CheckCircle2 size={12} />, label: "Verified" },
  pending: { bg: "#fef9c3", color: "#a16207", icon: <Clock size={12} />, label: "Pending" },
  rejected: { bg: "#fee2e2", color: "#dc2626", icon: <XCircle size={12} />, label: "Rejected" }
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={cssClass({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
      fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: s.bg, color: s.color })}>
      {s.icon}{s.label}
    </span>);

}

const INVEST_TYPES = [
"ELSS Mutual Fund", "Life Insurance", "PPF", "NSC", "Public Provident Fund",
"Home Loan Principal", "Home Loan Interest", "Tuition Fees", "NPS", "ULIP",
"Fixed Deposit (5yr)", "Sukanya Samriddhi", "Medical Insurance", "Other"];


export default function ProofInvestment() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cycle, setCycle] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [declaredItems, setDeclaredItems] = useState([]);


  const [investType, setInvestType] = useState(INVEST_TYPES[0]);
  const [declaredAmt, setDeclaredAmt] = useState("");
  const [actualAmt, setActualAmt] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [declRes, proofsRes] = await Promise.all([
      getMyITDeclaration().catch(() => null),
      getMyProofs().catch(() => [])]
      );
      if (declRes) {
        setCycle(declRes.cycle);
        setDeclaration(declRes.declaration);
        setDeclaredItems(declRes.items || []);
      }
      setProofs(Array.isArray(proofsRes) ? proofsRes : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {load();}, [load]);


  useEffect(() => {
    const match = declaredItems.find((i) =>
    i.sub_label?.toLowerCase().includes(investType.toLowerCase()) ||
    i.section_label?.toLowerCase().includes(investType.toLowerCase())
    );
    setDeclaredAmt(match ? String(match.declared_amount) : "");
  }, [investType, declaredItems]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("investment_type", investType);
      fd.append("declared_amount", declaredAmt || 0);
      fd.append("actual_amount", actualAmt || 0);
      await uploadProof(fd);
      setFile(null);
      setActualAmt("");
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleDelete = async (proofId) => {
    if (!window.confirm("Delete this proof?")) return;
    try {
      await deleteProof(proofId);
      setProofs((p) => p.filter((x) => x.proof_id !== proofId));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const isLocked = !cycle || cycle.status !== "active";
  const totalDeclared = proofs.reduce((s, p) => s + Number(p.declared_amount || 0), 0);
  const totalVerified = proofs.filter((p) => p.status === "verified").reduce((s, p) => s + Number(p.actual_amount || 0), 0);
  const pendingCount = proofs.filter((p) => p.status === "pending").length;
  const rejectedCount = proofs.filter((p) => p.status === "rejected").length;

  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8" })}>Loading…</div>;

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      {}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 })}>
        <div>
          <h1 className={cssClass({ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 })}>Proof of Investment</h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" })}>
            {cycle ? `${cycle.fy_label} · Deadline: ${cycle.end_date ? new Date(cycle.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}` : 'No active cycle'}
          </p>
        </div>
        <button onClick={load} className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer" })}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {}
      {declaration &&
      <div className={cssClass({ marginBottom: 16, padding: "10px 16px", borderRadius: 8, fontSize: 13,
        background: declaration.status === "approved" ? "#dcfce7" : declaration.status === "rejected" ? "#fee2e2" : "#fef9c3",
        color: declaration.status === "approved" ? "#15803d" : declaration.status === "rejected" ? "#dc2626" : "#a16207",
        border: `1px solid ${declaration.status === "approved" ? "#bbf7d0" : declaration.status === "rejected" ? "#fecaca" : "#fde68a"}`,
        display: "flex", alignItems: "flex-start", gap: 10 })}>
          <AlertCircle size={15} className={cssClass({ marginTop: 1, flexShrink: 0 })} />
          <div>
            <strong>IT Declaration: {declaration.status?.toUpperCase()}</strong>
            {declaration.admin_remarks && <p className={cssClass({ margin: "4px 0 0" })}>Admin remarks: {declaration.admin_remarks}</p>}
          </div>
        </div>
      }

      {}
      {proofs.length > 0 &&
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 })}>
          {[
        { label: "Uploaded", value: proofs.length, color: "#f18200" },
        { label: "Pending", value: pendingCount, color: "#a16207" },
        { label: "Verified", value: proofs.filter((p) => p.status === "verified").length, color: "#15803d" },
        { label: "Rejected", value: rejectedCount, color: "#dc2626" }].
        map((s) =>
        <div key={s.label} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
          padding: "12px 16px", textAlign: "center" })}>
              <p className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 })}>{s.value}</p>
              <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{s.label}</p>
            </div>
        )}
        </div>
      }

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, alignItems: "start" })}>
        {}
        <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" })}>
          <div className={cssClass({ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc",
            display: "flex", alignItems: "center", gap: 8 })}>
            <Upload size={15} className={cssClass({ color: "#f18200" })} />
            <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>Upload Proof</span>
            {isLocked && <Lock size={13} className={cssClass({ color: "#94a3b8", marginLeft: "auto" })} />}
          </div>
          <div className={cssClass({ padding: 20, opacity: isLocked ? 0.6 : 1 })}>
            {isLocked &&
            <div className={cssClass({ marginBottom: 16, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8 })}>
                <Lock size={13} /> Declaration cycle is closed. Uploads are disabled.
              </div>
            }

            <div className={cssClass({ marginBottom: 14 })}>
              <label className={cssClass({ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 })}>Investment Type</label>
              <select value={investType} onChange={(e) => setInvestType(e.target.value)} disabled={isLocked} className={cssClass(
                { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
                  fontSize: 13, color: "#1e293b", background: "#fff", outline: "none" })}>
                {INVEST_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 })}>
              <div>
                <label className={cssClass({ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 })}>Declared Amount (₹)</label>
                <input type="number" value={declaredAmt} onChange={(e) => setDeclaredAmt(e.target.value)}
                placeholder="0" disabled={isLocked} className={cssClass(
                  { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
                    fontSize: 13, outline: "none", boxSizing: "border-box" })} />
              </div>
              <div>
                <label className={cssClass({ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 })}>Actual Amount (₹)</label>
                <input type="number" value={actualAmt} onChange={(e) => setActualAmt(e.target.value)}
                placeholder="0" disabled={isLocked} className={cssClass(
                  { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
                    fontSize: 13, outline: "none", boxSizing: "border-box" })} />
              </div>
            </div>

            <div className={cssClass({ marginBottom: 16 })}>
              <label className={cssClass({ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 })}>Document (PDF / JPG / PNG)</label>
              <label className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "20px", border: `2px dashed ${file ? "#22c55e" : "#e2e8f0"}`, borderRadius: 8,
                cursor: isLocked ? "default" : "pointer", background: file ? "#f0fdf4" : "#fafbfc" })}>
                <Upload size={22} className={cssClass({ color: file ? "#22c55e" : "#94a3b8", marginBottom: 6 })} />
                <span className={cssClass({ fontSize: 12, color: file ? "#15803d" : "#64748b", fontWeight: file ? 600 : 400 })}>
                  {file ? file.name : "Click to select file"}
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={isLocked}
                onChange={(e) => setFile(e.target.files[0] || null)} className={cssClass({ display: "none" })} />
              </label>
            </div>

            <button onClick={handleUpload} disabled={!file || isLocked || uploading} className={cssClass(
              { width: "100%", padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: file && !isLocked ? "#f18200" : "#e2e8f0",
                color: file && !isLocked ? "#fff" : "#94a3b8",
                border: "none", cursor: file && !isLocked ? "pointer" : "not-allowed" })}>
              {uploading ? "Uploading…" : "Upload Proof"}
            </button>
          </div>
        </div>

        {}
        <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" })}>
          <div className={cssClass({ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc",
            display: "flex", justifyContent: "space-between", alignItems: "center" })}>
            <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>Uploaded Proofs</span>
            <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{proofs.length} document{proofs.length !== 1 ? "s" : ""}</span>
          </div>

          {proofs.length === 0 ?
          <div className={cssClass({ padding: 48, textAlign: "center" })}>
              <Upload size={40} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 8 })} />
              <p className={cssClass({ color: "#94a3b8", fontSize: 13 })}>No proofs uploaded yet.</p>
            </div> :

          <div>
              {proofs.map((p) =>
            <div key={p.proof_id} className={cssClass({ padding: "14px 18px", borderBottom: "1px solid #f8fafc" })}>
                  <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 })}>
                    <div className={cssClass({ flex: 1 })}>
                      <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" })}>{p.investment_type}</p>
                      <div className={cssClass({ display: "flex", gap: 16, flexWrap: "wrap" })}>
                        <span className={cssClass({ fontSize: 11, color: "#64748b" })}>Declared: <strong>{fmt(p.declared_amount)}</strong></span>
                        {p.actual_amount > 0 && <span className={cssClass({ fontSize: 11, color: "#64748b" })}>Actual: <strong>{fmt(p.actual_amount)}</strong></span>}
                        <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{new Date(p.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {p.actual_amount > 0 && p.actual_amount < p.declared_amount &&
                  <p className={cssClass({ fontSize: 11, color: "#f59e0b", margin: "3px 0 0" })}>
                          ⚠ Shortfall: {fmt(p.declared_amount - p.actual_amount)}
                        </p>
                  }
                      {}
                      {p.status === "rejected" && p.admin_remarks &&
                  <div className={cssClass({ marginTop: 6, padding: "6px 10px", background: "#fee2e2", borderRadius: 6, fontSize: 12, color: "#dc2626" })}>
                          <strong>Rejected:</strong> {p.admin_remarks}
                        </div>
                  }
                    </div>
                    <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 })}>
                      <StatusBadge status={p.status} />
                      <div className={cssClass({ display: "flex", gap: 6 })}>
                        {p.file_path &&
                    <a href={downloadProofUrl(p.proof_id)} target="_blank" rel="noreferrer" className={cssClass(
                      { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f18200",
                        textDecoration: "none", padding: "3px 8px", border: "1px solid #f18200", borderRadius: 5 })}>
                            <Download size={11} /> View
                          </a>
                    }
                        {p.status === "pending" && !isLocked &&
                    <button onClick={() => handleDelete(p.proof_id)} className={cssClass(
                      { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ef4444",
                        background: "none", border: "1px solid #fca5a5", borderRadius: 5, padding: "3px 8px", cursor: "pointer" })}>
                            <Trash2 size={11} /> Delete
                          </button>
                    }
                      </div>
                    </div>
                  </div>
                </div>
            )}
            </div>
          }

          {}
          {proofs.length > 0 &&
          <div className={cssClass({ padding: "12px 18px", background: "#f8fafc", borderTop: "1px solid #e8edf2" })}>
              <div className={cssClass({ display: "flex", justifyContent: "space-between", marginBottom: 4 })}>
                <span className={cssClass({ fontSize: 12, color: "#64748b" })}>Total Declared</span>
                <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{fmt(totalDeclared)}</span>
              </div>
              <div className={cssClass({ display: "flex", justifyContent: "space-between" })}>
                <span className={cssClass({ fontSize: 12, color: "#64748b" })}>Total Verified</span>
                <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#15803d" })}>{fmt(totalVerified)}</span>
              </div>
              {rejectedCount > 0 &&
            <p className={cssClass({ margin: "6px 0 0", fontSize: 12, color: "#dc2626" })}>
                  ⚠ {rejectedCount} proof(s) rejected — please re-upload with correct documents.
                </p>
            }
            </div>
          }
        </div>
      </div>
    </div>);

}
