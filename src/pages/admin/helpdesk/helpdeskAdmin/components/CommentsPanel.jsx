import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";
import { addComment } from "../../../../../api/helpdesk.api";
import { fmtDate } from "../utils/dateUtils";

const CommentsPanel = React.memo(({ ticket, onUpdated }) => {
  const [comment,    setComment]    = useState("");
  const [commenting, setCommenting] = useState(false);

  const doComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await addComment(ticket.ticket_id, comment.trim());
      setComment("");
      onUpdated();
    } catch { } finally { setCommenting(false); }
  };

  return (
    <div className={cssClass({ padding: "16px 24px", flex: 1 })}>
      <p className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" })}>
        Comments {ticket.comments?.length ? `(${ticket.comments.length})` : ""}
      </p>

      {ticket.comments?.length > 0 && (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 })}>
          {ticket.comments.map((c, i) => (
            <div key={i} className={cssClass({ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" })}>
              <div className={cssClass({ display: "flex", justifyContent: "space-between", marginBottom: 4 })}>
                <span className={cssClass({ fontSize: 12, fontWeight: 600, color: BRAND })}>{c.commented_by_name}</span>
                <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{fmtDate(c.created_at)}</span>
              </div>
              <p className={cssClass({ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 })}>{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className={cssClass({ display: "flex", gap: 8 })}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment or update…"
          rows={3}
          onFocus={(e) => e.target.style.borderColor = BRAND}
          onBlur={(e) => e.target.style.borderColor = "#dbe2ea"}
          className={cssClass({ flex: 1, padding: "8px 12px", border: "1px solid #dbe2ea", borderRadius: 8,
            fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit",
            lineHeight: 1.5, boxSizing: "border-box" })}
        />
        <button onClick={doComment} disabled={commenting || !comment.trim()}
          className={cssClass({ background: BRAND, color: "#fff", border: "none", borderRadius: 8,
            padding: "0 14px", cursor: "pointer", flexShrink: 0,
            opacity: !comment.trim() || commenting ? 0.5 : 1 })}>
          <MessageSquare size={15} />
        </button>
      </div>
    </div>
  );
});

CommentsPanel.displayName = "CommentsPanel";
export default CommentsPanel;
