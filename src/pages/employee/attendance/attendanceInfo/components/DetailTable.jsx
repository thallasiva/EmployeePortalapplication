import React from "react";

const DetailTable = React.memo(function DetailTable({ headers, values }) {
  return (
    <div className="overflow-x-auto border border-[#e8edf2] rounded">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="bg-[#f8fafc]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-2 text-left font-semibold text-[#64748b] border-b whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {values.map((v, i) => (
              <td key={headers[i]} className="px-2 py-2 text-[#334155] border-b">
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default DetailTable;
