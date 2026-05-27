import React from "react";
import { ChevronDown } from "lucide-react";

function DateSessionCell({ date, session }) {
  if (!session) {
    return <span>{date}</span>;
  }
  return (
    <div>
      <div>{date}</div>
      <div className="text-[11px] text-[#888] mt-0.5">{session}</div>
    </div>
  );
}

export default function LeaveTransactionTable({ transactions }) {
  const columns = [
    "Transaction type",
    "Posted on",
    "From",
    "To",
    "Days",
    "Reason",
    "Remarks",
    "Expiry Date",
  ];

  return (
    <table className="w-full border-collapse text-[13px] min-w-[900px]">
      <thead>
        <tr className="bg-[#ebf3fb]">
          {columns.map((col) => (
            <th
              key={col}
              className="px-3 py-2.5 text-left font-semibold text-[#555] border-b border-[#ddd] whitespace-nowrap"
            >
              {col === "Posted on" ? (
                <span className="inline-flex items-center gap-1">
                  {col}
                  <ChevronDown size={14} className="text-[#666]" />
                </span>
              ) : (
                col
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-3 py-6 text-center text-[#888] border-b border-[#ddd]"
            >
              No transactions found
            </td>
          </tr>
        ) : (
          transactions.map((row, index) => (
            <tr key={index} className="bg-white hover:bg-[#fafafa]">
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333]">
                {row.type}
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333]">
                {row.postedOn}
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333]">
                <DateSessionCell
                  date={row.fromDate}
                  session={row.fromSession}
                />
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333]">
                <DateSessionCell date={row.toDate} session={row.toSession} />
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333] text-center">
                {row.days}
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333] max-w-[200px]">
                {row.reason}
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333]">
                {row.remarks || ""}
              </td>
              <td className="px-3 py-2.5 border-b border-[#ddd] text-[#333]">
                {row.expiryDate}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
