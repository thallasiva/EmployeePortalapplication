import { tblFmt } from "./shared";
export /* ── Data row component ── */
const DataRow = ({
  label,
  dataKey,
  totalVal,
  bold,
  highlight,
  monthData
}) => <tr className={`border-b border-[#e2e8f0] ${highlight ? "bg-[#e8f4fa]" : bold ? "bg-[#f1f5f9]" : "bg-white hover:bg-[#fafbff]"} transition-colors`}>
      <td className={`px-4 py-2 text-[12px] sticky left-0 border-r border-[#e2e8f0] whitespace-nowrap ${bold ? "font-bold text-[#e87500]" : "font-normal text-[#475569]"} ${highlight ? "bg-[#e8f4fa]" : bold ? "bg-[#f1f5f9]" : "bg-white"}`} style={{
    paddingLeft: 24
  }}>
        {label}
      </td>
      <td className={`px-4 py-2 text-right text-[12px] sticky border-r border-[#e2e8f0] whitespace-nowrap ${bold ? "font-bold text-[#e87500]" : "font-medium text-[#334155]"} ${highlight ? "bg-[#e8f4fa]" : bold ? "bg-[#f1f5f9]" : "bg-white"}`} style={{
    left: 150
  }}>
        {tblFmt(totalVal)}
      </td>
      {monthData.map((m, i) => <td key={i} className="px-3 py-2 text-right text-[12px] whitespace-nowrap" style={{
    color: (m[dataKey] || 0) > 0 ? highlight ? "#cf6900" : "#334155" : "#94a3b8"
  }}>
          {tblFmt(m[dataKey] || 0)}
        </td>)}
    </tr>;
