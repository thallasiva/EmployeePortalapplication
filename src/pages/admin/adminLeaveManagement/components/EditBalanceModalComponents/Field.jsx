import { cssClass } from "../../../../../utils/classStyles";
const Field = ({
  k,
  label,
  form,
  setForm
}) => <div>
    <label className={cssClass({
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 5
  })}>{label}</label>
    <input type="number" min={0} step={0.5} value={form[k]} onChange={e => setForm(p => ({
    ...p,
    [k]: e.target.value
  }))} className={cssClass({
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit"
  })} />
  </div>;
export { Field };
