import React, { useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { reviewDeclaration, reviewProof, adminDownloadProofUrl } from "../../../../api/itDeclaration.api";
import { BRAND, DECL_STATUS, PROOF_STATUS, fmt, fmtDate } from "../constants";
import Badge from "./Badge";
import ReviewModal from "./ReviewModal";

const EmpRow = React.memo(function EmpRow({ row, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null);

  const decl = row.declaration;
  const status = decl?.status || "not_started";
  const total = row.items?.reduce((s, i) => s + Number(i.declared_amount || 0), 0) || 0;

  return (
    <>
      <tr onClick={() => setOpen((o) => !o)}
        className={cssClass({ borderBottom: "1px solid #f1f5f9", cursor: "pointer",
          background: open ? "#fafbfc" : "#fff" })}>
        <td className={cssClass({ padding: "12px 16px" })}>
          <div className={cssClass({ fontWeight: 600, fontSize: 13, color: "#1e293b" })}>{row.employee_name}</div>
          <div className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{row.emp_code} · {row.department_name || "—"}</div>
        </td>
        <td className={cssClass({ padding: "12px 16px", fontSize: 13, color: "#64748b" })}>{row.job_title || "—"}</td>
        <td className={cssClass({ padding: "12px 16px" })}><Badge status={status} map={DECL_STATUS} /></td>
        <td className={cssClass({ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1e293b" })}>
          {total > 0 ? fmt(total) : <span className={cssClass({ color: "#cbd5e1" })}>—</span>}
        </td>
        <td className={cssClass({ padding: "12px 16px", fontSize: 12, color: "#94a3b8" })}>{fmtDate(decl?.submitted_at)}</td>
        <td onClick={(e) => e.stopPropagation()} className={cssClass({ padding: "12px 16px" })}>
          {status === "submitted" && (
            <button onClick={() => setModal({ type: "decl" })}
              className={cssClass({ fontSize: 11, padding: "4px 12px", borderRadius: 6, fontWeight: 600,
                cursor: "pointer", border: `1px solid ${BRAND}`, background: "#fff8f0", color: BRAND })}>
              Review
            </button>
          )}
          {(status === "approved" || status === "rejected") && (
            <button onClick={() => setModal({ type: "decl" })}
              className={cssClass({ fontSize: 11, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b" })}>
              Change
            </button>
          )}
        </td>
        <td className={cssClass({ padding: "12px 16px", textAlign: "center" })}>
          {open
            ? <ChevronUp size={14} className={cssClass({ color: "#94a3b8" })} />
            : <ChevronDown size={14} className={cssClass({ color: "#94a3b8" })} />}
        </td>
      </tr>

      {open && (
        <tr className={cssClass({ background: "#f8fafc" })}>
          <td colSpan={7} className={cssClass({ padding: "0 16px 16px 32px" })}>
            <div className={cssClass({ paddingTop: 14, borderTop: "1px solid #e2e8f0" })}>
              {decl?.admin_remarks && (
                <div className={cssClass({ marginBottom: 12, padding: "8px 14px", borderRadius: 8, fontSize: 12,
                  background: status === "approved" ? "#f0fdf4" : "#fee2e2",
                  color: status === "approved" ? "#15803d" : "#dc2626" })}>
                  <strong>Admin remarks:</strong> {decl.admin_remarks}
                </div>
              )}

              {row.items?.length > 0 && (
                <div className={cssClass({ marginBottom: 14 })}>
                  <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" })}>
                    Declaration Items
                  </p>
                  <div className={cssClass({ display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8 })}>
                    {row.items.map((it, i) => (
                      <div key={i} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0",
                        borderRadius: 8, padding: "10px 12px" })}>
                        <p className={cssClass({ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                          margin: "0 0 2px", textTransform: "uppercase" })}>{it.section_key}</p>
                        <p className={cssClass({ fontSize: 12, color: "#334155", margin: "0 0 4px" })}>
                          {it.sub_label || it.section_label}
                        </p>
                        <p className={cssClass({ fontSize: 13, fontWeight: 700, color: BRAND, margin: 0 })}>
                          {fmt(it.declared_amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {row.proofs?.length > 0 && (
                <div>
                  <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" })}>
                    Proof Documents
                  </p>
                  <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
                    {row.proofs.map((p) => (
                      <div key={p.proof_id} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0",
                        borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 })}>
                        <div className={cssClass({ flex: 1 })}>
                          <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 3px" })}>
                            {p.investment_type}
                          </p>
                          <div className={cssClass({ display: "flex", gap: 14, flexWrap: "wrap" })}>
                            <span className={cssClass({ fontSize: 11, color: "#64748b" })}>
                              Declared: <strong>{fmt(p.declared_amount)}</strong>
                            </span>
                            {p.actual_amount > 0 && (
                              <span className={cssClass({ fontSize: 11, color: "#64748b" })}>
                                Actual: <strong>{fmt(p.actual_amount)}</strong>
                              </span>
                            )}
                          </div>
                          {p.admin_remarks && (
                            <p className={cssClass({ fontSize: 11, color: "#dc2626", margin: "3px 0 0" })}>
                              {p.admin_remarks}
                            </p>
                          )}
                        </div>
                        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                          <Badge status={p.status} map={PROOF_STATUS} />
                          {p.file_path && (
                            <a href={adminDownloadProofUrl(p.proof_id)} target="_blank" rel="noreferrer"
                              className={cssClass({ fontSize: 11, color: BRAND, textDecoration: "none",
                                padding: "3px 8px", border: `1px solid ${BRAND}`, borderRadius: 5,
                                display: "flex", alignItems: "center", gap: 4 })}>
                              <Download size={11} /> View
                            </a>
                          )}
                          {p.status === "pending" && (
                            <button onClick={() => setModal({ type: "proof", id: p.proof_id, label: p.investment_type })}
                              className={cssClass({ fontSize: 11, padding: "3px 10px", borderRadius: 5,
                                fontWeight: 600, cursor: "pointer",
                                border: `1px solid ${BRAND}`, background: "#fff8f0", color: BRAND })}>
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!row.items?.length && !row.proofs?.length && (
                <p className={cssClass({ color: "#94a3b8", fontSize: 13, margin: 0 })}>
                  No declaration submitted yet.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}

      {modal?.type === "decl" && (
        <ReviewModal title={`Review: ${row.employee_name}`} onClose={() => setModal(null)}
          onSubmit={async (st, rm) => {
            await reviewDeclaration(decl.declaration_id, { status: st, admin_remarks: rm });
            onRefresh();
          }} />
      )}
      {modal?.type === "proof" && (
        <ReviewModal title={`Review Proof: ${modal.label}`} onClose={() => setModal(null)}
          onSubmit={async (st, rm) => {
            await reviewProof(modal.id, { status: st, admin_remarks: rm });
            onRefresh();
          }} />
      )}
    </>
  );
});

export default EmpRow;
