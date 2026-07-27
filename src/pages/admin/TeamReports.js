























































import React from "react";
import { avatarDataUri } from "../../lib/placeholders";

export default function TeamReports() {
  const data = [
  { name: "Danny Ward" },
  { name: "Linda Craver" },
  { name: "Jenni Sims" },
  { name: "Maria Cotton" },
  { name: "John Gibbs" }];


  return (
    <div className="bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm text-gray-700">

          {}
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Reviewers</th>
              <th className="px-6 py-4 text-left">Active</th>
              <th className="px-6 py-4 text-left">Employment</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Job Title</th>
              <th className="px-6 py-4 text-left">Line Manager</th>
              <th className="px-6 py-4 text-left">Team Name</th>
              <th className="px-6 py-4 text-left">Start Date</th>
            </tr>
          </thead>

          {}
          <tbody>
            {data.map((item, index) =>
            <tr
              key={index}
              className="border-t hover:bg-gray-50 transition">


                {}
                <td className="px-6 py-4 flex items-center gap-3">
                  <img
                  src={avatarDataUri(index + 10)}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover" />

                  <span className="font-medium text-gray-800">
                    {item.name}
                  </span>
                </td>

                {}
                <td className="px-6 py-4">
                  <select className="border border-brand text-brand px-3 py-1 rounded-md bg-white focus:outline-none">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </td>

                {}
                <td className="px-6 py-4">Permanent</td>

                {}
                <td className="px-6 py-4">
                  <span className="text-brand cursor-pointer">
                    [email protected]
                  </span>
                </td>

                {}
                <td className="px-6 py-4">Team Lead</td>

                {}
                <td className="px-6 py-4">Richard Wilson</td>

                {}
                <td className="px-6 py-4">Designing</td>

                {}
                <td className="px-6 py-4">Designing</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}
