import { cssClass } from "../../../../../../utils/classStyles";
/* ─── RichTextArea ─── */
export const Label = ({
  f
}) => <label className={cssClass({
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  display: "block",
  marginBottom: 6
})}>
      {f.label} {f.required && <span className={cssClass({
    color: "#ef4444"
  })}>*</span>}
    </label>;
