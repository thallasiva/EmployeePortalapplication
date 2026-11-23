import { cssClass } from "../../../../../utils/classStyles";
const FormField = ({
  k,
  label,
  type = "text",
  form,
  set,
  ...rest
}) => <div>
    <label className={cssClass({
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 5
  })}>{label}</label>
    <input type={type} value={form[k] ?? ""} onChange={e => set(k, e.target.value)} {...rest} className={cssClass({
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit"
  })} />
  </div>;
export { FormField };
