import { Label } from "./Label";
import { ChevronDown } from "lucide-react";
import { BRAND, INPUT_BASE } from "../../../utils/helpdeskUtils";
import { cssClass } from "../../../../../../utils/classStyles";
/* ─── RichTextArea ─── */
import { RichTextArea } from "./RichTextArea";
/* ─── DynamicField ─── */
function DynamicField({
  f,
  value,
  onChange
}) {
  const focusBorder = e => e.target.style.borderColor = BRAND;
  const blurBorder = e => e.target.style.borderColor = "#d1d5db";
  switch (f.type) {
    case "richtext":
      return <RichTextArea key={f.key} label={f.label} required={!!f.required} value={value} onChange={onChange} />;
    case "text":
      return <div className={cssClass({
        marginBottom: 16
      })}>
          <Label f={f} />
          <input value={value} onChange={e => onChange(e.target.value)} placeholder={f.placeholder || ""} onFocus={focusBorder} onBlur={blurBorder} className={cssClass(INPUT_BASE)} />
        </div>;
    case "datetime":
      return <div className={cssClass({
        marginBottom: 16
      })}>
          <Label f={f} />
          <div className={cssClass({
          display: "flex",
          gap: 10
        })}>
            <input type="date" value={value.date ?? ""} onChange={e => onChange({
            ...value,
            date: e.target.value
          })} onFocus={focusBorder} onBlur={blurBorder} className={cssClass({
            ...INPUT_BASE,
            flex: 1
          })} />
            <input type="time" value={value.time ?? ""} onChange={e => onChange({
            ...value,
            time: e.target.value
          })} onFocus={focusBorder} onBlur={blurBorder} className={cssClass({
            ...INPUT_BASE,
            flex: 1
          })} />
          </div>
        </div>;
    case "date":
      return <div className={cssClass({
        marginBottom: 16
      })}>
          <Label f={f} />
          <input type="date" value={value} onChange={e => onChange(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} className={cssClass({
          ...INPUT_BASE,
          maxWidth: 200
        })} />
          {f.note && <p className={cssClass({
          fontSize: 12,
          color: BRAND,
          margin: "4px 0 0"
        })}>{f.note}</p>}
        </div>;
    case "select":
    case "searchselect":
      return <div className={cssClass({
        marginBottom: 16
      })}>
          <Label f={f} />
          <div className={cssClass({
          position: "relative"
        })}>
            <select value={value} onChange={e => onChange(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} className={cssClass({
            ...INPUT_BASE,
            appearance: "none",
            paddingRight: 32,
            cursor: "pointer",
            color: value ? "#374151" : "#9ca3af"
          })}>
              <option value="">{f.placeholder || "— select —"}</option>
              {(f.options || []).filter(o => o).map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown size={14} className={cssClass({
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            pointerEvents: "none"
          })} />
          </div>
        </div>;
    default:
      return null;
  }
}
/* ─── RequestModal ─── */
export { DynamicField };
