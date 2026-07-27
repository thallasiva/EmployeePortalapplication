import React, { useState, useEffect } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export const PAGE_SIZES = [20, 50, 100, 200, 500];
export const DEFAULT_PAGE_SIZE = 20;

export function usePagination(data, defaultPageSize = DEFAULT_PAGE_SIZE)
{
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);


  useEffect(() => { setPage(1); }, [data]);
  useEffect(() => { setPage(1); }, [pageSize]);

  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = (data ?? []).slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return { paged, page: safePage, setPage, totalPages, from, to, total, pageSize, setPageSize };
}

export default function Pagination({ page, setPage, totalPages, from, to, total, pageSize, setPageSize })
{

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white text-[13px] text-gray-600 select-none">

      { }
      <div className="flex items-center gap-2">
        <span className="text-[12px]">Items per page:</span>
        {setPageSize ?
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="appearance-none border border-gray-300 rounded px-2 py-0.5 pr-6 text-[13px] bg-white focus:outline-none focus:border-[#d97706] cursor-pointer">

              {PAGE_SIZES.map((s) =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
          </div> :

          <span className="font-medium">{pageSize ?? DEFAULT_PAGE_SIZE}</span>
        }
      </div>

      { }
      <span className="text-[12px]">
        {total === 0 ? "0 of 0" : `${from} – ${to} of ${total}`}
      </span>

      { }
      <div className="flex items-center gap-0.5">
        { }
        <button
          onClick={() => setPage(1)}
          disabled={!canPrev}
          title="First page"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">

          <ChevronsLeft size={15} />
        </button>
        { }
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev}
          title="Previous page"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">

          <ChevronLeft size={15} />
        </button>
        { }
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={!canNext}
          title="Next page"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">

          <ChevronRight size={15} />
        </button>
        { }
        <button
          onClick={() => setPage(totalPages)}
          disabled={!canNext}
          title="Last page"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">

          <ChevronsRight size={15} />
        </button>
      </div>
    </div>);

}
