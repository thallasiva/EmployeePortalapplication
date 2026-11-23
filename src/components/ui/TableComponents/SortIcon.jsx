import { memo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
/* ─── SortIcon ────────────────────────────────────────────────────────────── */
const SortIcon = memo(function SortIcon({
  direction
}) {
  if (direction === "asc") return <ChevronUp size={12} />;
  if (direction === "desc") return <ChevronDown size={12} />;
  return <ChevronsUpDown size={12} className="opacity-40" />;
});
/* ─── Table ───────────────────────────────────────────────────────────────── */
/**
 * Generic, sortable, accessible data table.
 *
 * columns: Array<{
 *   key: string,
 *   label: string,
 *   sortable?: boolean,
 *   align?: 'left'|'center'|'right',
 *   render?: (value, row, index) => ReactNode,
 *   className?: string,    // cell className
 *   headerClass?: string,  // header cell className
 * }>
 *
 * @param {Array}    columns
 * @param {Array}    data
 * @param {string}   [rowKey]        — row.id by default; fallback to index
 * @param {boolean}  [loading]
 * @param {string}   [emptyTitle]
 * @param {string}   [emptyDesc]
 * @param {function} [onRowClick]
 * @param {string}   [className]
 * @param {boolean}  [stickyHeader]
 */
export { SortIcon };
