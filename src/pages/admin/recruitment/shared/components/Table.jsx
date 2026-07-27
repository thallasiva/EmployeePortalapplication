import React from "react";

const PAGE_SIZES = [20, 50, 100, 200, 500];

export const Table = React.memo(function Table({
  columns, data, onRowClick, emptyMessage = "No records found.", pageSize: initialPageSize = 20,
}) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  React.useEffect(() => { setPage(1); }, [data]);
  React.useEffect(() => { setPage(1); }, [pageSize]);

  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = (data ?? []).slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

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

      {/* Pagination bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white text-[13px] text-gray-600 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[12px]">Items per page:</span>
          <div className="relative">
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="appearance-none border border-gray-300 rounded px-2 py-0.5 pr-6 text-[13px] bg-white focus:outline-none focus:border-[#d97706] cursor-pointer">
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
          </div>
        </div>
        <span className="text-[12px]">{total === 0 ? "0 of 0" : `${from} – ${to} of ${total}`}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setPage(1)} disabled={safePage === 1} title="First page"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">{"|<"}</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">{"<"}</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">{">"}</button>
          <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last page"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">{">|"}</button>
        </div>
      </div>
    </div>
  );
});
