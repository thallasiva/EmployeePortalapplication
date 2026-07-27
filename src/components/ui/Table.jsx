import { memo, useCallback, useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

/* ─── SortIcon ────────────────────────────────────────────────────────────── */
const SortIcon = memo(function SortIcon({ direction })
{
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
const Table = memo(function Table({
  columns,
  data = [],
  rowKey = "id",
  loading = false,
  emptyTitle = "No records found",
  emptyDesc,
  onRowClick,
  className = "",
  stickyHeader = false,
})
{
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = useCallback((key) =>
  {
    setSortKey((prev) =>
    {
      if (prev === key)
      {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const sorted = useMemo(() =>
  {
    if (!sortKey) return data;
    return [...data].sort((a, b) =>
    {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const clickable = typeof onRowClick === "function";

  const thClass = (col) =>
    `px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 tracking-wide uppercase whitespace-nowrap select-none ${col.sortable ? "cursor-pointer hover:text-gray-700" : ""} ${col.headerClass ?? ""}`;

  const tdClass = (col) =>
    `px-3 py-2.5 text-[13px] text-gray-700 ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse min-w-[600px]" role="table">
        <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={thClass(col)}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12">
                <LoadingSpinner className="mx-auto" />
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyDesc} />
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr
                key={row[rowKey] ?? idx}
                className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${clickable ? "cursor-pointer" : ""}`}
                onClick={clickable ? () => onRowClick(row) : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={clickable ? (e) => e.key === "Enter" && onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={tdClass(col)}>
                    {col.render ? col.render(row[col.key], row, idx) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default Table;
