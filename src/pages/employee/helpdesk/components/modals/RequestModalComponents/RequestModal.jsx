import { memo, useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { createTicket } from "../../../../../../api/helpdesk.api";
import { TOPIC_CONFIG, DEFAULT_FIELDS } from "../../../constants/topicConfig";
import { BRAND, BRAND_LIGHT, BRAND_BORDER, buildDescription } from "../../../utils/helpdeskUtils";
import { cssClass } from "../../../../../../utils/classStyles";
/* ─── RichTextArea ─── */
import { DynamicField } from "./DynamicField";
/* ─── RequestModal ─── */
const RequestModal = memo(function RequestModal({
  category,
  topic,
  onClose,
  onSubmitted
}) {
  const config = TOPIC_CONFIG[topic.id] || {};
  const fieldDefs = config.fields || DEFAULT_FIELDS;
  const afterDefs = config.afterFields || [];
  const summaryLabel = config.summaryLabel || "Summary";
  const summaryHint = config.summaryHint || null;
  const {
    Icon
  } = topic;
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [vals, setVals] = useState(() => {
    const obj = {};
    [...fieldDefs, ...afterDefs].forEach(f => {
      obj[f.key] = f.type === "datetime" ? {
        date: "",
        time: ""
      } : "";
    });
    return obj;
  });
  const setVal = useCallback((key, value) => setVals(prev => ({
    ...prev,
    [key]: value
  })), []);
  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError(summaryLabel + " is required.");
      return;
    }
    for (const f of [...fieldDefs, ...afterDefs]) {
      if (f.required && !String(vals[f.key] ?? "").trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTicket({
        category: category.label,
        subject: "[" + topic.label + "] " + summary.trim(),
        description: buildDescription(fieldDefs, afterDefs, vals),
        priority: "Medium"
      });
      onSubmitted();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return <div onClick={onClose} className={cssClass({
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  })}>
      <div onClick={e => e.stopPropagation()} className={cssClass({
      width: "100%",
      maxWidth: 580,
      maxHeight: "90vh",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    })}>
        {/* Header */}
        <div className={cssClass({
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "18px 24px",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0
      })}>
          <div className={cssClass({
          width: 40,
          height: 40,
          borderRadius: 10,
          background: BRAND_LIGHT,
          border: "1.5px solid " + BRAND_BORDER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        })}>
            <Icon size={20} color={BRAND} strokeWidth={1.75} />
          </div>
          <div className={cssClass({
          flex: 1,
          minWidth: 0
        })}>
            <p className={cssClass({
            fontSize: 15,
            fontWeight: 700,
            color: BRAND,
            margin: 0
          })}>{topic.label}</p>
            <p className={cssClass({
            fontSize: 12,
            color: "#6b7280",
            margin: 0
          })}>{topic.desc}</p>
          </div>
          <button onClick={onClose} className={cssClass({
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af",
          fontSize: 20,
          lineHeight: 1,
          padding: 4,
          flexShrink: 0
        })} aria-label="Close"><X size={18} /></button>
        </div>
        {/* Body */}
        <div className={cssClass({
        flex: 1,
        overflowY: "auto",
        padding: "22px 24px"
      })}>
          <p className={cssClass({
          fontSize: 12,
          color: "#9ca3af",
          margin: "0 0 18px"
        })}>Required fields are marked with an asterisk *</p>
          {error && <div className={cssClass({
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 6,
          padding: "10px 14px",
          fontSize: 13,
          color: "#dc2626",
          marginBottom: 14
        })}>{error}</div>}
          {/* Summary */}
          <div className={cssClass({
          marginBottom: 16
        })}>
            <label className={cssClass({
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            display: "block",
            marginBottom: 6
          })}>
              {summaryLabel} <span className={cssClass({
              color: "#ef4444"
            })}>*</span>
            </label>
            <input autoFocus value={summary} onChange={e => setSummary(e.target.value)} placeholder={summaryHint || "e.g. Issue with " + topic.label} onFocus={e => e.target.style.borderColor = BRAND} onBlur={e => e.target.style.borderColor = "#d1d5db"} className={cssClass({
            width: "100%",
            height: 38,
            padding: "0 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
            color: "#374151"
          })} />
            {summaryHint && <p className={cssClass({
            fontSize: 12,
            color: BRAND,
            margin: "4px 0 0"
          })}>{summaryHint}</p>}
          </div>
          {fieldDefs.map(f => <DynamicField key={f.key} f={f} value={vals[f.key]} onChange={v => setVal(f.key, v)} />)}
          {/* Attachment */}
          <div className={cssClass({
          marginBottom: afterDefs.length ? 20 : 8
        })}>
            <label className={cssClass({
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            display: "block",
            marginBottom: 6
          })}>Attachment</label>
            <div className={cssClass({
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "18px",
            textAlign: "center",
            background: "#fafafa"
          })}>
              <p className={cssClass({
              fontSize: 13,
              color: BRAND,
              margin: "0 0 10px"
            })}>{file ? file.name : "Drag and drop files, paste screenshots, or browse"}</p>
              <label>
                <span className={cssClass({
                border: "1px solid #d1d5db",
                background: "#fff",
                borderRadius: 4,
                padding: "6px 22px",
                fontSize: 13,
                color: "#374151",
                cursor: "pointer",
                display: "inline-block"
              })}>Browse</span>
                <input type="file" hidden onChange={e => setFile(e.target.files[0] || null)} />
              </label>
            </div>
          </div>
          {afterDefs.map(f => <DynamicField key={f.key} f={f} value={vals[f.key]} onChange={v => setVal(f.key, v)} />)}
        </div>
        {/* Footer */}
        <div className={cssClass({
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 24px",
        borderTop: "1px solid #e5e7eb",
        flexShrink: 0,
        background: "#fafafa"
      })}>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={cssClass({
          background: BRAND,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "9px 32px",
          fontSize: 14,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1
        })}>
            {submitting ? "Sending…" : "Send"}
          </button>
          <button data-cancel-button type="button" onClick={onClose} className={cssClass({
          background: "none",
          color: "#6b7280",
          border: "none",
          padding: "9px 4px",
          fontSize: 14,
          cursor: "pointer"
        })}>
            Cancel
          </button>
        </div>
      </div>
    </div>;
});
export { RequestModal };
