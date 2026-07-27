/**
 * HelpdeskAdmin — shared view for Admin and Reporting Manager.
 *
 * Ticket lifecycle:
 *   Open → (Manager) Forwarded to Team → (Admin/Team) In Progress → Resolved → (Employee) Accept → Closed
 *                   └→ Rejected                                                              └→ Not Satisfied → Reopened → In Progress → …
 *
 * Admin        : sees ALL tickets; can set In Progress → Resolved (they ARE the concerned team)
 * Manager      : sees team tickets; can Approve+Forward-to-team  OR  Reject
 * Both         : can add comments at any stage
 */
import React, { useState, useEffect, useCallback } from "react";
import {

  Headphones, RefreshCw, Search, ChevronDown, MessageSquare,
  ThumbsUp, ThumbsDown, CheckCircle, Filter, ArrowRight } from
"lucide-react";
import {

  allTickets, teamTickets, managerAction, updateTicketStatus, addComment } from
"../../../api/helpdesk.api";
import { getStoredUser, isAdmin } from "../../../data/auth";

/* ── Constants ──────────────────────────────────────────── */import { cssClass, joinClasses } from "../../../utils/classStyles";
const BRAND = "#f18200";
const TEAMS = ["IT Team", "Admin Team", "HR Team", "Finance Team"];

const STATUS_COLOR = {
  "Open": { bg: "#eff6ff", color: "#2563eb" },
  "Forwarded": { bg: "#f5f3ff", color: "#7c3aed" },
  "In Progress": { bg: "#fff7ed", color: "#c2410c" },
  "Reopened": { bg: "#fff1f2", color: "#be123c" },
  "Resolved": { bg: "#f0fdf4", color: "#15803d" },
  "Closed": { bg: "#f8fafc", color: "#64748b" },
  "Rejected": { bg: "#fef2f2", color: "#b91c1c" }
};

const ALL_STATUSES = ["Open", "Forwarded", "In Progress", "Reopened", "Resolved", "Closed", "Rejected"];

const TEAM_COLOR = {
  "IT Team": { bg: "#eff6ff", color: "#2563eb" },
  "Admin Team": { bg: "#fff7ed", color: "#c2410c" },
  "HR Team": { bg: "#fdf4ff", color: "#7e22ce" },
  "Finance Team": { bg: "#f0fdf4", color: "#15803d" }
};

function fmtDate(iso)
{
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso)
{
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/* ── Ticket Detail Slide-over ────────────────────────────── */
function TicketDetail({ ticket, isAdminUser, onClose, onUpdated })
{
  const sc = STATUS_COLOR[ticket.status] || STATUS_COLOR["Open"];
  const tc = TEAM_COLOR[ticket.forwarded_to_team] || {};

  /* Manager state */
  const [step, setStep] = useState("idle"); // idle | pick-team | reject
  const [team, setTeam] = useState("");
  const [rejectMsg, setRejectMsg] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState(null);

  /* Admin status update */
  const [saving, setSaving] = useState(false);

  /* Comments */
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  /* ── Manager actions ── */
  const doManagerAction = async (action) =>
  {
    if (action === "approve" && !team) {setActError("Select a team to forward to.");return;}
    if (action === "reject" && !rejectMsg.trim()) {setActError("Reason is required.");return;}
    setActLoading(true);setActError(null);
    try
    {
      await managerAction(ticket.ticket_id, action, team || null, rejectMsg.trim() || null);
      onUpdated();
    } catch (e)
    {
      setActError(e?.response?.data?.message || "Action failed.");
    } finally {setActLoading(false);}
  };

  /* ── Admin status update ── */
  const doStatusUpdate = async (status) =>
  {
    setSaving(true);
    try {await updateTicketStatus(ticket.ticket_id, status);onUpdated();}
    catch {/* silent */} finally
    {setSaving(false);}
  };

  /* ── Comment ── */
  const doComment = async () =>
  {
    if (!comment.trim()) return;
    setCommenting(true);
    try {await addComment(ticket.ticket_id, comment.trim());setComment("");onUpdated();}
    catch {/* silent */} finally
    {setCommenting(false);}
  };

  const alreadyActioned = ticket.status !== "Open";

  return (
    <div onClick={onClose} className={cssClass(
      {
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end"
      })}>
      <div onClick={(e) => e.stopPropagation()} className={cssClass(
        {
          width: 520, height: "100vh", background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column", overflowY: "auto"
        })}>

        {/* ── Header ── */}
        <div className={cssClass({ padding: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 })}>
          <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 })}>
            <div className={cssClass({ flex: 1, minWidth: 0 })}>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 })}>
                <span className={cssClass({
                  fontSize: 11, background: sc.bg, color: sc.color,
                  padding: "3px 10px", borderRadius: 20, fontWeight: 700
                })}>{ticket.status}</span>
                {ticket.forwarded_to_team &&
                <span className={cssClass({
                  fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                  background: tc.bg || "#f3f4f6", color: tc.color || "#374151"
                })}>
                    → {ticket.forwarded_to_team}
                  </span>
                }
              </div>
              <h3 className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0, lineHeight: 1.4 })}>
                {ticket.subject}
              </h3>
            </div>
            <button onClick={onClose} className={cssClass({
              background: "none", border: "none",
              fontSize: 18, color: "#94a3b8", cursor: "pointer", padding: 4, flexShrink: 0
            })}>✕</button>
          </div>
        </div>

        {/* ── Meta ── */}
        <div className={cssClass({
          padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", flexShrink: 0
        })}>
          {[
          { label: "Raised by", value: ticket.employee_name || "—" },
          { label: "Employee Code", value: ticket.emp_code || "—" },
          { label: "Category", value: ticket.category || "—" },
          { label: "Raised on", value: `${fmtDate(ticket.created_at)} ${fmtTime(ticket.created_at)}` },
          { label: "Forwarded to", value: ticket.forwarded_to_team || "—" },
          { label: "Resolved at", value: ticket.resolved_at ? fmtDate(ticket.resolved_at) : "—" }].
          map((m) =>
          <div key={m.label}>
              <p className={cssClass({
              fontSize: 10, color: "#94a3b8", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px"
            })}>{m.label}</p>
              <p className={cssClass({ fontSize: 13, color: "#1e293b", margin: 0, fontWeight: 500 })}>{m.value}</p>
            </div>
          )}
        </div>

        {/* ── Description ── */}
        {ticket.description &&
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 })}>
            <p className={cssClass({
            fontSize: 10, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px"
          })}>Request Details</p>
            <p className={cssClass({
            fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0,
            whiteSpace: "pre-line"
          })}>{ticket.description}</p>
          </div>
        }

        {/* ══ MANAGER SECTION ══ */}
        {!isAdminUser &&
        <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 })}>
            <p className={cssClass({
            fontSize: 10, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px"
          })}>Manager Decision</p>

            {alreadyActioned ?
          <div className={cssClass({
            padding: "10px 14px", borderRadius: 8,
            background: sc.bg, border: `1px solid ${sc.color}33`,
            fontSize: 13, color: sc.color, fontWeight: 600
          })}>
                {ticket.status === "Forwarded" ?
            `✓ Forwarded to ${ticket.forwarded_to_team}` :
            ticket.status === "Rejected" ?
            "✕ Request rejected" :
            `Status: ${ticket.status}`}
              </div> :

          <>
                {actError &&
            <div className={cssClass({
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6,
              padding: "8px 12px", fontSize: 12, color: "#dc2626", marginBottom: 10
            })}>
                    {actError}
                  </div>
            }

                {/* ── Idle state: two buttons ── */}
                {step === "idle" &&
            <div className={cssClass({ display: "flex", gap: 8 })}>
                    <button onClick={() => {setStep("pick-team");setActError(null);}} className={cssClass(
                {
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700
                })}>
                      <ThumbsUp size={15} /> Approve & Forward
                    </button>
                    <button onClick={() => {setStep("reject");setActError(null);}} className={cssClass(
                {
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                  background: "#fff", border: "1.5px solid #b91c1c",
                  color: "#b91c1c", fontSize: 13, fontWeight: 700
                })}>
                      <ThumbsDown size={15} /> Reject
                    </button>
                  </div>
            }

                {/* ── Pick team to forward ── */}
                {step === "pick-team" &&
            <div>
                    <p className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 8px" })}>
                      Forward to which team?
                    </p>
                    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 })}>
                      {TEAMS.map((t) =>
                {
                  const tc2 = TEAM_COLOR[t] || {};
                  return (
                    <button key={t} onClick={() => setTeam(t)} className={cssClass(
                      {
                        padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", textAlign: "left",
                        border: team === t ? `2px solid ${tc2.color || BRAND}` : "1.5px solid #e2e8f0",
                        background: team === t ? tc2.bg || BRAND_LIGHT : "#fff",
                        color: team === t ? tc2.color || BRAND : "#374151"
                      })}>{t}</button>);

                })}
                    </div>
                    <div className={cssClass({ marginBottom: 8 })}>
                      <label className={cssClass({ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 })}>
                        Note to team (optional)
                      </label>
                      <textarea value={rejectMsg === "" ? "" : rejectMsg}
                onChange={(e) => setRejectMsg(e.target.value)}
                placeholder="Any instructions for the team…"
                rows={2}





                onFocus={(e) => e.target.style.borderColor = BRAND}
                onBlur={(e) => e.target.style.borderColor = "#dbe2ea"} className={cssClass({ width: "100%", padding: "7px 10px", border: "1px solid #dbe2ea", borderRadius: 6, fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" })} />
                    </div>
                    <div className={cssClass({ display: "flex", gap: 8 })}>
                      <button onClick={() => doManagerAction("approve")} disabled={actLoading || !team} className={cssClass(
                  {
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "9px 0", borderRadius: 8, border: "none",
                    cursor: actLoading || !team ? "not-allowed" : "pointer",
                    background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700,
                    opacity: actLoading || !team ? 0.6 : 1
                  })}>
                        <ArrowRight size={14} /> Forward to {team || "Team"}
                      </button>
                      <button onClick={() => {setStep("idle");setTeam("");setRejectMsg("");setActError(null);}} className={cssClass(
                  {
                    padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer"
                  })}>
                        Back
                      </button>
                    </div>
                  </div>
            }

                {/* ── Reject with reason ── */}
                {step === "reject" &&
            <div>
                    <label className={cssClass({
                fontSize: 12, fontWeight: 600, color: "#374151",
                display: "block", marginBottom: 6
              })}>
                      Reason for rejection <span className={cssClass({ color: "#ef4444" })}>*</span>
                    </label>
                    <textarea value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)}
              placeholder="Explain why this request is being rejected…"
              rows={3}





              onFocus={(e) => e.target.style.borderColor = "#b91c1c"}
              onBlur={(e) => e.target.style.borderColor = "#dbe2ea"} className={cssClass({ width: "100%", padding: "8px 10px", border: "1px solid #dbe2ea", borderRadius: 6, fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" })} />
                    <div className={cssClass({ display: "flex", gap: 8 })}>
                      <button onClick={() => doManagerAction("reject")} disabled={actLoading || !rejectMsg.trim()} className={cssClass(
                  {
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "9px 0", borderRadius: 8, border: "none",
                    cursor: actLoading || !rejectMsg.trim() ? "not-allowed" : "pointer",
                    background: "#b91c1c", color: "#fff", fontSize: 13, fontWeight: 700,
                    opacity: actLoading || !rejectMsg.trim() ? 0.6 : 1
                  })}>
                        <ThumbsDown size={14} /> Confirm Reject
                      </button>
                      <button onClick={() => {setStep("idle");setRejectMsg("");setActError(null);}} className={cssClass(
                  {
                    padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer"
                  })}>
                        Back
                      </button>
                    </div>
                  </div>
            }
              </>
          }
          </div>
        }

        {/* ══ ADMIN / TEAM SECTION ══ */}
        {isAdminUser &&
        <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 })}>
            <p className={cssClass({
            fontSize: 10, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px"
          })}>
              Work on Request
            </p>

            {ticket.status === "Forwarded" &&
          <div className={cssClass({
            marginBottom: 12, padding: "10px 14px", background: "#f5f3ff",
            border: "1px solid #ddd6fe", borderRadius: 8, fontSize: 13, color: "#7c3aed"
          })}>
                📨 Forwarded to <strong>{ticket.forwarded_to_team}</strong> — take ownership and start working
              </div>
          }

            {ticket.status === "Reopened" &&
          <div className={cssClass({
            marginBottom: 12, padding: "10px 14px", background: "#fff1f2",
            border: "1px solid #fecdd3", borderRadius: 8, fontSize: 13, color: "#be123c"
          })}>
                ↩ Employee was <strong>not satisfied</strong> with the resolution — please re-examine the issue
              </div>
          }

            {["Forwarded", "In Progress", "Reopened"].includes(ticket.status) &&
          <div className={cssClass({ display: "flex", gap: 8, flexWrap: "wrap" })}>
                {["Forwarded", "Reopened"].includes(ticket.status) &&
            <button onClick={() => doStatusUpdate("In Progress")} disabled={saving} className={cssClass(
              {
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8, border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                background: "#c2410c", color: "#fff", fontSize: 13, fontWeight: 700,
                opacity: saving ? 0.7 : 1
              })}>
                    Start Working (In Progress)
                  </button>
            }
                {ticket.status === "In Progress" &&
            <button onClick={() => doStatusUpdate("Resolved")} disabled={saving} className={cssClass(
              {
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8, border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700,
                opacity: saving ? 0.7 : 1
              })}>
                    <CheckCircle size={15} /> Mark as Resolved
                  </button>
            }
              </div>
          }

            {["Resolved", "Closed", "Rejected"].includes(ticket.status) &&
          <div className={cssClass({
            padding: "10px 14px", borderRadius: 8,
            background: sc.bg, border: `1px solid ${sc.color}33`,
            fontSize: 13, color: sc.color, fontWeight: 600
          })}>
                {ticket.status === "Resolved" ? "✓ Issue resolved — awaiting employee confirmation" :
            ticket.status === "Closed" ? "✓ Ticket closed by employee" :
            "✕ Rejected by manager"}
              </div>
          }
          </div>
        }

        {/* ── Comments ── */}
        <div className={cssClass({ padding: "16px 24px", flex: 1 })}>
          <p className={cssClass({
            fontSize: 10, color: "#94a3b8", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px"
          })}>
            Comments {ticket.comments?.length ? `(${ticket.comments.length})` : ""}
          </p>
          {ticket.comments?.length > 0 &&
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 })}>
              {ticket.comments.map((c, i) =>
            <div key={i} className={cssClass({ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" })}>
                  <div className={cssClass({ display: "flex", justifyContent: "space-between", marginBottom: 4 })}>
                    <span className={cssClass({ fontSize: 12, fontWeight: 600, color: BRAND })}>{c.commented_by_name}</span>
                    <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{fmtDate(c.created_at)}</span>
                  </div>
                  <p className={cssClass({ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 })}>{c.comment}</p>
                </div>
            )}
            </div>
          }
          <div className={cssClass({ display: "flex", gap: 8 })}>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment or update…"
            rows={3}





            onFocus={(e) => e.target.style.borderColor = BRAND}
            onBlur={(e) => e.target.style.borderColor = "#dbe2ea"} className={cssClass({ flex: 1, padding: "8px 12px", border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" })} />
            <button onClick={doComment} disabled={commenting || !comment.trim()} className={cssClass(
              {
                background: BRAND, color: "#fff", border: "none", borderRadius: 8,
                padding: "0 14px", cursor: "pointer", flexShrink: 0,
                opacity: !comment.trim() || commenting ? 0.5 : 1
              })}>
              <MessageSquare size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>);

}

/* ── Main ────────────────────────────────────────────────── */
const BRAND_LIGHT = "#fff7ed";

export default function HelpdeskAdmin()
{
  const user = getStoredUser();
  const isAdminUser = isAdmin(user);

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [teamF, setTeamF] = useState(isAdminUser ? "Admin Team" : "");
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [20, 50, 100, 200, 500];
  const [limit, setLimit] = React.useState(20);
  const LIMIT = limit;

  const load = useCallback(async () =>
  {
    setLoading(true);
    try
    {
      const params = {
        limit: LIMIT, offset: (page - 1) * LIMIT,
        ...(search ? { search } : {}),
        ...(statusF ? { status: statusF } : {}),
        ...(teamF ? { forwarded_to_team: teamF } : {})
      };
      const fn = isAdminUser ? allTickets : teamTickets;
      const data = await fn(params);
      setTickets(Array.isArray(data) ? data : data?.rows || []);
      setTotal(data?.total || 0);
    } catch {setTickets([]);setTotal(0);} finally
    {setLoading(false);}
  }, [isAdminUser, page, search, statusF, teamF, limit]);

  useEffect(() => {load();}, [load]);

  /* Summary counts */
  const counts = tickets.reduce((acc, t) => {acc[t.status] = (acc[t.status] || 0) + 1;return acc;}, {});
  const summaryCards = [
  { label: "Open", value: counts["Open"] || 0, color: "#2563eb", bg: "#eff6ff" },
  { label: "Forwarded", value: counts["Forwarded"] || 0, color: "#7c3aed", bg: "#f5f3ff" },
  { label: "In Progress", value: counts["In Progress"] || 0, color: "#c2410c", bg: "#fff7ed" },
  { label: "Reopened", value: counts["Reopened"] || 0, color: "#be123c", bg: "#fff1f2" },
  { label: "Resolved", value: counts["Resolved"] || 0, color: "#15803d", bg: "#f0fdf4" },
  { label: "Total", value: total, color: BRAND, bg: "#fff7ed" }];


  return (
    <div className={cssClass({
      height: "calc(100vh - 4.25rem)", background: "#f5f7fb",
      display: "flex", flexDirection: "column", padding: "16px 20px 12px", overflow: "hidden"
    })}>

      {/* Header */}
      <div className={cssClass({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexShrink: 0
      })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          <Headphones size={20} color={BRAND} />
          <div>
            <h1 className={cssClass({ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 })}>
              {isAdminUser ? "Helpdesk — All Tickets" : "Helpdesk — My Team's Requests"}
            </h1>
            <p className={cssClass({ fontSize: 12, color: "#64748b", margin: 0 })}>
              {isAdminUser ?
              "Work on forwarded tickets: In Progress → Resolved" :
              "Review, approve & forward — or reject — your team's requests"}
            </p>
          </div>
        </div>
        <button onClick={load} className={cssClass({
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "7px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b"
        })}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className={cssClass({ display: "flex", gap: 10, marginBottom: 16, flexShrink: 0, flexWrap: "wrap" })}>
        {summaryCards.map((s) =>
        <div key={s.label} className={cssClass({
          background: s.bg, border: `1px solid ${s.color}33`,
          borderRadius: 10, padding: "10px 16px", minWidth: 90,
          display: "flex", alignItems: "center", gap: 10
        })}>
            <div className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color })}>{s.value}</div>
            <div className={cssClass({ fontSize: 11, color: s.color, fontWeight: 600, lineHeight: 1.3 })}>{s.label}</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 14, flexShrink: 0, flexWrap: "wrap", alignItems: "center" })}>
        <div className={cssClass({ position: "relative" })}>
          <Search size={13} className={cssClass({
            position: "absolute", left: 9, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8"
          })} />
          <input value={search} onChange={(e) => {setSearch(e.target.value);setPage(1);}}
          placeholder="Search tickets…"





          onFocus={(e) => e.target.style.borderColor = BRAND}
          onBlur={(e) => e.target.style.borderColor = "#dbe2ea"} className={cssClass({ height: 34, width: 200, paddingLeft: 28, paddingRight: 10, border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 12, outline: "none", background: "#fff" })} />
        </div>

        {[
        {
          value: statusF, setter: (v) => {setStatusF(v);setPage(1);},
          placeholder: "All Status", options: ALL_STATUSES
        },
        // Admin is locked to "Admin Team" — no team dropdown shown
        ...(!isAdminUser ? [{
          value: teamF, setter: (v) => {setTeamF(v);setPage(1);},
          placeholder: "All Teams", options: TEAMS
        }] : [])].
        map((f, i) =>
        <div key={i} className={cssClass({ position: "relative" })}>
            <select value={f.value} onChange={(e) => f.setter(e.target.value)} className={cssClass(
            {
              height: 34, paddingLeft: 10, paddingRight: 28,
              border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 12,
              background: "#fff", outline: "none", cursor: "pointer",
              appearance: "none", color: "#374151"
            })}>
              <option value="">{f.placeholder}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={12} className={cssClass({
            position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none"
          })} />
          </div>
        )}

        {(search || statusF || !isAdminUser && teamF) &&
        <button onClick={() => {setSearch("");setStatusF("");if (!isAdminUser) setTeamF("");setPage(1);}} className={cssClass(
          {
            background: "none", border: "none", color: "#94a3b8", fontSize: 12,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4
          })}>
            <Filter size={12} /> Clear
          </button>
        }
      </div>

      {/* Ticket table */}
      <div className={cssClass({
        flex: 1, background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 12, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column"
      })}>

        <div className={cssClass({
          display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1.1fr 1fr 0.8fr",
          padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
          fontSize: 11, fontWeight: 700, color: "#64748b",
          textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0
        })}>
          <span>Subject</span><span>Employee</span><span>Category</span>
          <span>Forwarded To</span><span>Status</span><span>Date</span>
        </div>

        <div className={cssClass({ flex: 1, overflowY: "auto" })}>
          {loading ?
          <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading…</div> :
          tickets.length === 0 ?
          <div className={cssClass({ padding: 60, textAlign: "center" })}>
              <Headphones size={36} strokeWidth={1.2} color="#e2e8f0" />
              <p className={cssClass({ fontSize: 13, color: "#94a3b8", marginTop: 12 })}>No tickets found.</p>
            </div> :
          tickets.map((t, i) =>
          {
            const sc = STATUS_COLOR[t.status] || STATUS_COLOR["Open"];
            const tc2 = TEAM_COLOR[t.forwarded_to_team] || {};
            const needsAction = !isAdminUser && t.status === "Open";
            const needsWork = isAdminUser && ["Forwarded", "In Progress", "Reopened"].includes(t.status);
            return (
              <div key={t.ticket_id} onClick={() => setSelected(t)}








              onMouseEnter={(e) => e.currentTarget.style.background = needsAction || needsWork ? "#fff7ed" : "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = needsAction || needsWork ? "#fffbf5" : "transparent"} className={cssClass({ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1.1fr 1fr 0.8fr", padding: "12px 16px", borderBottom: i < tickets.length - 1 ? "1px solid #f1f5f9" : "none", cursor: "pointer", alignItems: "center", background: needsAction || needsWork ? "#fffbf5" : "transparent", borderLeft: needsAction || needsWork ? `3px solid ${BRAND}` : "3px solid transparent" })}>
                <div className={cssClass({ minWidth: 0 })}>
                  <p className={cssClass({
                    fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  })}>
                    {t.subject}
                  </p>
                  {t.description &&
                  <p className={cssClass({
                    fontSize: 11, color: "#94a3b8", margin: "2px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  })}>
                      {t.description}
                    </p>
                  }
                </div>
                <div>
                  <p className={cssClass({ fontSize: 12, color: "#374151", fontWeight: 500, margin: 0 })}>{t.employee_name || "—"}</p>
                  <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{t.emp_code || ""}</p>
                </div>
                <span className={cssClass({ fontSize: 12, color: "#64748b" })}>{t.category || "—"}</span>
                <span>
                  {t.forwarded_to_team ?
                  <span className={cssClass({
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    background: tc2.bg || "#f3f4f6", color: tc2.color || "#374151"
                  })}>
                      {t.forwarded_to_team}
                    </span> :
                  <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>—</span>}
                </span>
                <span className={cssClass({
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                  background: sc.bg, color: sc.color, alignSelf: "start", display: "inline-block"
                })}>
                  {t.status}
                </span>
                <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{fmtDate(t.created_at)}</span>
              </div>);

          })}
        </div>

        {/* Pagination */}
        {total > LIMIT &&
        <div className={cssClass({
          padding: "10px 16px", borderTop: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "#64748b", flexShrink: 0
        })}>
            <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div className={cssClass({ display: "flex", gap: 4 })}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={cssClass(
              {
                padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1, fontSize: 12
              })}>← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total} className={cssClass(
              {
                padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                background: "#fff", cursor: page * LIMIT >= total ? "not-allowed" : "pointer",
                opacity: page * LIMIT >= total ? 0.5 : 1, fontSize: 12
              })}>Next →</button>
            </div>
          </div>
        }
      </div>

      {selected &&
      <TicketDetail ticket={selected} isAdminUser={isAdminUser}
      onClose={() => setSelected(null)}
      onUpdated={() => {load();setSelected(null);}} />
      }
    </div>);

}
