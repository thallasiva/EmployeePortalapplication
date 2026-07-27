import React, { useState } from "react";
import { ChevronRight, ChevronDown, Eye } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { nodeColor } from "../utils/formatters";

const TreeNode = React.memo(function TreeNode({ node, depth = 0, onSelect }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const color = nodeColor(node);

  return (
    <div className={cssClass({ marginLeft: depth === 0 ? 0 : 20 })}>
      <div
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        className={cssClass({
          display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
          borderRadius: 8, cursor: "pointer", marginBottom: 2,
          background: "transparent", transition: "background .15s",
        })}
      >
        <button
          onClick={() => hasChildren && setOpen((o) => !o)}
          className={cssClass({
            width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", background: "none",
            cursor: hasChildren ? "pointer" : "default",
            color: hasChildren ? "#6b7280" : "transparent",
            padding: 0, flexShrink: 0,
          })}
        >
          {hasChildren ? open ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}
        </button>

        <div className={cssClass({
          width: 30, height: 30, borderRadius: "50%", background: color + "20",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color, flexShrink: 0,
        })}>
          {node.name?.[0] || "?"}
        </div>

        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
            <span className={cssClass({
              fontSize: 13, fontWeight: 600, color: "#111827",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160,
            })}>
              {node.name}
            </span>
            {node.delegate_name && (
              <span className={cssClass({
                fontSize: 10, background: "#fef3c7", color: "#92400e",
                borderRadius: 4, padding: "1px 5px", fontWeight: 600, whiteSpace: "nowrap",
              })}>
                🟡 Delegated → {node.delegate_name}
              </span>
            )}
            {node.status === "Inactive" && (
              <span className={cssClass({
                fontSize: 10, background: "#f3f4f6", color: "#6b7280",
                borderRadius: 4, padding: "1px 5px",
              })}>
                ⚫ Inactive
              </span>
            )}
          </div>
          <div className={cssClass({ fontSize: 11, color: "#6b7280", marginTop: 1 })}>
            {node.designation} {node.department ? `· ${node.department}` : ""}
            {node.direct_count > 0 && (
              <span className={cssClass({ marginLeft: 6, color: "#f18200", fontWeight: 600 })}>
                ({node.direct_count} reports)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onSelect(node)}
          className={cssClass({
            flexShrink: 0, background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
            padding: "3px 8px", cursor: "pointer", fontSize: 11, color: "#6b7280",
            display: "flex", alignItems: "center", gap: 4,
          })}
        >
          <Eye size={12} /> View
        </button>
      </div>

      {hasChildren && open && (
        <div className={cssClass({ borderLeft: "2px solid #e5e7eb", marginLeft: 26, paddingLeft: 4 })}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
});

export default TreeNode;
