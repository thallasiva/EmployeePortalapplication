import React, { useMemo, useState } from "react";
function VirtualListDemo() {
  const items = useMemo(() => Array.from({
    length: 5000
  }, (_, index) => `Row ${index + 1}`), []);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 36;
  const viewportHeight = 280;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(items.length, startIndex + Math.ceil(viewportHeight / rowHeight) + 4);
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);
  return <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">Virtualization</h3>
      <p className="mb-3 text-sm text-slate-600">Only the visible rows render, which keeps large lists smooth.</p>
      <div className="overflow-auto rounded-xl border border-slate-200" style={{
      height: viewportHeight
    }} onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
        <div style={{
        height: items.length * rowHeight,
        position: "relative"
      }}>
          <div style={{
          transform: `translateY(${startIndex * rowHeight}px)`
        }}>
            {visibleItems.map((item, index) => <div key={`${item}-${startIndex + index}`} className="flex h-9 items-center border-b border-slate-100 px-3 text-sm text-slate-700">
                {item}
              </div>)}
          </div>
        </div>
      </div>
    </div>;
}
export { VirtualListDemo };
