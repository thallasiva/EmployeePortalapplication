import React, { useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";

const CHART = { NW: 172, NH: 60, HGAP: 60, VGAP: 16 };
const TOGGLE_R = 10;

function placeNodes(node, depth, counter, flat, edges) {
  const item = {
    id: node.id, name: node.name, designation: node.designation,
    department: node.department, status: node.status,
    direct_count: node.direct_count || 0,
    delegate_name: node.delegate_name || null,
    depth, y: 0,
  };
  flat.push(item);
  const kids = node.children || [];
  if (kids.length === 0) {
    item.y = counter.v;
    counter.v += CHART.NH + CHART.VGAP;
  } else {
    const startY = counter.v;
    kids.forEach((child) => {
      edges.push({ fromId: node.id, toId: child.id });
      placeNodes(child, depth + 1, counter, flat, edges);
    });
    item.y = (startY + counter.v - CHART.VGAP - CHART.NH) / 2;
  }
}

function collectHasChildren(node, map = {}) {
  const kids = node.children || [];
  map[node.id] = kids.length > 0;
  kids.forEach((c) => collectHasChildren(c, map));
  return map;
}

function applyCollapse(node, collapsed) {
  const kids = collapsed.has(node.id)
    ? []
    : (node.children || []).map((c) => applyCollapse(c, collapsed));
  return { ...node, children: kids };
}

const OrgChart = React.memo(function OrgChart({ nodes, onSelect, highlightIds = new Set() }) {
  const [collapsed, setCollapsed] = useState(new Set());

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!nodes || nodes.length === 0) return null;

  const visNodes = nodes.map((r) => applyCollapse(r, collapsed));
  const flat = [], edges = [], counter = { v: 0 };
  visNodes.forEach((root) => placeNodes(root, 0, counter, flat, edges));

  const hasChildrenMap = {};
  nodes.forEach((r) => collectHasChildren(r, hasChildrenMap));

  const byId = {};
  flat.forEach((n) => { byId[n.id] = n; });

  const maxDepth = Math.max(...flat.map((n) => n.depth), 0);
  const svgW = (maxDepth + 1) * (CHART.NW + CHART.HGAP) + 30;
  const svgH = counter.v + TOGGLE_R * 2 + 20;

  const nx = (d) => d * (CHART.NW + CHART.HGAP) + 14;
  const ny = (item) => item.y + 14;
  const boxColor = (item) => {
    if (item.status === "Inactive") return "#9ca3af";
    if (item.depth === 0) return "#1e40af";
    if (item.direct_count > 0) return "#0284c7";
    if (item.delegate_name) return "#d97706";
    return "#38bdf8";
  };

  return (
    <div className={cssClass({ overflowX: "auto", overflowY: "visible" })}>
      <svg width={svgW} height={svgH} className={cssClass({ display: "block", minWidth: svgW })}>
        {edges.map((e, i) => {
          const f = byId[e.fromId]; const t = byId[e.toId];
          if (!f || !t) return null;
          const x1 = nx(f.depth) + CHART.NW;
          const y1 = ny(f) + CHART.NH / 2;
          const x2 = nx(t.depth);
          const y2 = ny(t) + CHART.NH / 2;
          const mx = (x1 + x2) / 2;
          return (
            <path key={i} d={`M${x1},${y1} H${mx} V${y2} H${x2}`}
              fill="none" stroke="#93c5fd" strokeWidth={1.5} strokeLinecap="round" />
          );
        })}

        {flat.map((item) => {
          const x = nx(item.depth);
          const y = ny(item);
          const bg = boxColor(item);
          const isHighlighted = highlightIds.has(item.id);
          const label = item.name.length > 20 ? item.name.slice(0, 19) + "…" : item.name;
          const desig = (item.designation || "").length > 23
            ? item.designation.slice(0, 22) + "…"
            : item.designation || "—";

          return (
            <g key={item.id}>
              {isHighlighted && (
                <rect x={x - 4} y={y - 4} width={CHART.NW + 8} height={CHART.NH + 8}
                  rx={11} fill="none" stroke="#f18200" strokeWidth={3} opacity={0.9} />
              )}
              <g onClick={() => onSelect && onSelect(item)} className={cssClass({ cursor: "pointer" })}>
                <rect x={x + 2} y={y + 2} width={CHART.NW} height={CHART.NH} rx={8} fill="#00000015" />
                <rect x={x} y={y} width={CHART.NW} height={CHART.NH} rx={8} fill={isHighlighted ? "#f18200" : bg} />
                <text x={x + CHART.NW / 2} y={y + 24} textAnchor="middle" fill="white"
                  fontSize={12} fontWeight="700"
                  className={cssClass({ fontFamily: "system-ui,sans-serif", pointerEvents: "none" })}>
                  {label}
                </text>
                <text x={x + CHART.NW / 2} y={y + 40} textAnchor="middle" fill="rgba(255,255,255,0.85)"
                  fontSize={10}
                  className={cssClass({ fontFamily: "system-ui,sans-serif", pointerEvents: "none" })}>
                  {desig}
                </text>
                {item.direct_count > 0 && (
                  <>
                    <rect x={x + CHART.NW - 34} y={y + 4} width={32} height={15} rx={7} fill="rgba(255,255,255,0.25)" />
                    <text x={x + CHART.NW - 18} y={y + 14} textAnchor="middle" fill="white"
                      fontSize={9} fontWeight="700"
                      className={cssClass({ fontFamily: "system-ui,sans-serif", pointerEvents: "none" })}>
                      {item.direct_count} 👥
                    </text>
                  </>
                )}
              </g>
              {hasChildrenMap[item.id] && (
                <g onClick={(e) => { e.stopPropagation(); toggle(item.id); }} className="cursor-pointer">
                  <circle cx={nx(item.depth) + CHART.NW / 2} cy={ny(item) + CHART.NH + TOGGLE_R + 2}
                    r={TOGGLE_R} fill="#fff" stroke={BRAND} strokeWidth={1.5} />
                  <text x={nx(item.depth) + CHART.NW / 2} y={ny(item) + CHART.NH + TOGGLE_R + 7}
                    textAnchor="middle" fill={BRAND} fontSize={12} fontWeight="900"
                    className={cssClass({ fontFamily: "system-ui,sans-serif", pointerEvents: "none" })}>
                    {collapsed.has(item.id) ? "+" : "−"}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default OrgChart;
