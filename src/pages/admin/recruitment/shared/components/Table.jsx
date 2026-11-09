import React from "react";
import Pagination, { usePagination } from "../../../../../components/Pagination";
export const Table = React.memo(function Table({
  columns, data, onRowClick, emptyMessage = "No records found.", pageSize: initialPageSize = 20,
}) {
  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(data, initialPageSize);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col, i) => (
                <th key={i} style={{ width: col.width }}
                  className="px-3.5 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-[0.04em] whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {total === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-8 text-center text-gray-400 text-[13px]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, ri) => (
                <tr key={ri} onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-gray-100 transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                  }`}>
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-3.5 py-[11px] text-gray-700 align-middle">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
    </div>
  );
});
