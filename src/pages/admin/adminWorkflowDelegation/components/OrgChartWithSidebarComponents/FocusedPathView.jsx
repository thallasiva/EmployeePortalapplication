import React from "react";
import { X } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../../constants/tabs";
/** Inline mini-SVG showing the focused path (main → manager → employee). */
function FocusedPathView({
  focusedPath,
  setFocusedPath
}) {
  const NW = 180,
    NH = 64,
    GAP = 70;
  const nodes3 = [focusedPath.main && focusedPath.main.id !== focusedPath.manager?.id && focusedPath.main.id !== focusedPath.employee?.id ? {
    ...focusedPath.main,
    role: "Main",
    color: "#9b4c00"
  } : null, focusedPath.manager && focusedPath.manager.id !== focusedPath.employee?.id ? {
    ...focusedPath.manager,
    role: "Reporting Manager",
    color: "#e87500"
  } : null, focusedPath.employee ? {
    ...focusedPath.employee,
    role: "Selected Employee",
    color: "#e87500"
  } : null].filter(Boolean);
  const svgW = nodes3.length * (NW + GAP) - GAP + 20;
  const svgH = NH + 80;
  return <div>
      <div className={cssClass({
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: 12
    })}>
        <button onClick={() => setFocusedPath(null)} className={cssClass({
        background: "none",
        border: "1px solid #e5e7eb",
        borderRadius: 7,
        padding: "4px 10px",
        fontSize: 12,
        color: "#6b7280",
        cursor: "pointer"
      })}>
          <X size={12} className="inline -mt-0.5" /> Show full chart
        </button>
      </div>
      <svg width={svgW} height={svgH} className={cssClass({
      overflow: "visible"
    })}>
        {nodes3.slice(0, -1).map((_, i) => {
        const x1 = 10 + i * (NW + GAP) + NW;
        const x2 = 10 + (i + 1) * (NW + GAP);
        const y = NH / 2 + 10;
        return <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="#fdba74" strokeWidth={2} />
              <polygon points={`${x2},${y} ${x2 - 8},${y - 5} ${x2 - 8},${y + 5}`} fill="#fdba74" />
            </g>;
      })}
        {nodes3.map((node, i) => {
        const x = 10 + i * (NW + GAP);
        const y = 10;
        const isEmployee = node.color === "#e87500";
        return <g key={node.id}>
              {isEmployee && <rect x={x - 4} y={y - 4} width={NW + 8} height={NH + 8} rx={11} fill="none" stroke="#e87500" strokeWidth={2.5} />}
              <rect x={x + 2} y={y + 2} width={NW} height={NH} rx={8} fill="#00000012" />
              <rect x={x} y={y} width={NW} height={NH} rx={8} fill={node.color} />
              <text x={x + NW / 2} y={y + 26} textAnchor="middle" fill="white" fontSize={13} fontWeight="700" className={cssClass({
            fontFamily: "var(--font-ui)",
            pointerEvents: "none"
          })}>
                {(node.name || "").length > 20 ? node.name.slice(0, 19) + "…" : node.name}
              </text>
              <text x={x + NW / 2} y={y + 44} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10} className={cssClass({
            fontFamily: "var(--font-ui)",
            pointerEvents: "none"
          })}>
                {node.role}
              </text>
              <text x={x + NW / 2} y={y + NH + 18} textAnchor="middle" fill={isEmployee ? BRAND : "#6b7280"} fontSize={11} fontWeight={isEmployee ? 700 : 400} className={cssClass({
            fontFamily: "var(--font-ui)"
          })}>
                {node.name}
              </text>
            </g>;
      })}
      </svg>
      {focusedPath.raw && <div className={cssClass({
      marginTop: 16,
      padding: "12px 14px",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10
    })}>
          <div className={cssClass({
        fontSize: 13,
        fontWeight: 700,
        color: "#111827"
      })}>{focusedPath.raw.full_name}</div>
          <div className={cssClass({
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2
      })}>
            {focusedPath.raw.designation_name || "—"} · {focusedPath.raw.department_name || "—"}
          </div>
          {focusedPath.manager && <div className={cssClass({
        marginTop: 6,
        fontSize: 12,
        color: "#374151"
      })}>
              <span className={cssClass({
          color: "#9ca3af"
        })}>Reporting to: </span>
              <span className={cssClass({
          fontWeight: 600,
          color: BRAND
        })}>{focusedPath.manager.name}</span>
            </div>}
        </div>}
    </div>;
}
export { FocusedPathView };
