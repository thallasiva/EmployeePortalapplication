import { Bold, Italic, Ellipsis, Type, List, ListOrdered, Link2, AtSign, Smile, Code, Plus } from "lucide-react";
import { cssClass } from "../../../../../../utils/classStyles";
/* ─── RichTextArea ─── */
/* ─── RichTextArea ─── */
function RichTextArea({
  label,
  value,
  onChange,
  required
}) {
  return <div className={cssClass({
    marginBottom: 16
  })}>
      {label && <label className={cssClass({
      fontSize: 13,
      fontWeight: 600,
      color: "#374151",
      display: "block",
      marginBottom: 6
    })}>
          {label} {required && <span className={cssClass({
        color: "#ef4444"
      })}>*</span>}
        </label>}
      <div className={cssClass({
      border: "1px solid #d1d5db",
      borderRadius: 6,
      overflow: "hidden"
    })}>
        <div className={cssClass({
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "5px 8px",
        borderBottom: "1px solid #e5e7eb",
        background: "#f9fafb",
        flexWrap: "wrap"
      })}>
          {["Normal text", <Bold size={13} />, <Italic size={13} />, <Ellipsis size={13} />, <Type size={13} />, <List size={13} />, <ListOrdered size={13} />, <Link2 size={13} />, <AtSign size={13} />, <Smile size={13} />, <Code size={13} />, <Plus size={13} />].map((lbl, idx) => <button key={idx} type="button" className={cssClass({
          padding: "2px 6px",
          border: "none",
          background: "none",
          fontSize: idx === 0 ? 11 : 13,
          color: "#374151",
          cursor: "default",
          display: "inline-flex",
          alignItems: "center"
        })}>
              {lbl}
            </button>)}
        </div>
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Describe in detail…" rows={4} className={cssClass({
        width: "100%",
        padding: "10px 12px",
        border: "none",
        fontSize: 13,
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
        boxSizing: "border-box",
        lineHeight: 1.5,
        color: "#374151",
        display: "block"
      })} />
      </div>
    </div>;
}
/* ─── DynamicField ─── */
export { RichTextArea };
