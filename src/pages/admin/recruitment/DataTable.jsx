import Badge from "./Badge";
import { badgeColor } from "./data";

function DataTable({ columns, rows })
{
  const minWidthClass = columns.length > 8 ? "min-w-[1200px]" : "min-w-[760px]";
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${minWidthClass}`}>
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap border-b-[0.5px] border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-500">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row["Job ID"] || row.Name || row.Candidate || index} className="border-b-[0.5px] border-gray-100">
              {columns.map((column) =>
              {
                const value = row[column] ?? "-";
                const isStatus = column.toLowerCase().includes("status") || column === "Job Status";
                return (
                  <td key={column} className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                    {isStatus ? <Badge color={badgeColor(value)}>{value}</Badge> : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;