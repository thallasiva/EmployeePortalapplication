
// const TeamReports = () =>
// {
//     return (
//         <div>
//             <div className="bg-white rounded-xl shadow overflow-x-auto">
//                 <table className="min-w-full text-sm">
//                     <thead className="bg-gray-100">
//                         <tr>
//                             <th className="p-3 text-left">Employee</th>
//                             <th className="p-3 text-left">Gender</th>
//                             <th className="p-3 text-left">Salary</th>
//                             <th className="p-3 text-left">DOB</th>
//                             <th className="p-3 text-left">Phone</th>
//                             <th className="p-3 text-left">Address</th>
//                             <th className="p-3 text-left">Company</th>
//                             <th className="p-3 text-left">ID</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         <tr className="border-t">
//                             <td className="p-3 flex items-center gap-2">
//                                 <img className="w-8 h-8 rounded-full" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" />
//                                 Sean Black
//                             </td>
//                             <td className="p-3">Male</td>
//                             <td className="p-3">$3000</td>
//                             <td className="p-3">25 Jan 1984</td>
//                             <td className="p-3">987654321</td>
//                             <td className="p-3">201 Lunetta Street, Plant City, Florida</td>
//                             <td className="p-3">Life Essence Banks Inc.</td>
//                             <td className="p-3">11230987652</td>
//                         </tr>

//                         <tr className="border-t">
//                             <td className="p-3 flex items-center gap-2">
//                                 <img className="w-8 h-8 rounded-full" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" />
//                                 Maria Cotton
//                             </td>
//                             <td className="p-3">Female</td>
//                             <td className="p-3">$1000</td>
//                             <td className="p-3">14 Feb 1984</td>
//                             <td className="p-3">987654321</td>
//                             <td className="p-3">683 Longview Avenue, New York</td>
//                             <td className="p-3">Life Essence Banks Inc.</td>
//                             <td className="p-3">11230987652</td>
//                         </tr>
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     )
// }

// export default TeamReports

import React from "react";
import { avatarDataUri } from "../../lib/placeholders";

export default function TeamReports() {
  const data = [
    { name: "Danny Ward" },
    { name: "Linda Craver" },
    { name: "Jenni Sims" },
    { name: "Maria Cotton" },
    { name: "John Gibbs" },
  ];

  return (
    <div className="bg-gray-100 p-6">
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm text-gray-700">
          
          {/* Header */}
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

          {/* Body */}
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className="border-t hover:bg-gray-50 transition"
              >
                
                {/* Reviewer */}
                <td className="px-6 py-4 flex items-center gap-3">
                  <img
                    src={avatarDataUri(index + 10)}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="font-medium text-gray-800">
                    {item.name}
                  </span>
                </td>

                {/* Active Dropdown */}
                <td className="px-6 py-4">
                  <select className="border border-brand text-brand px-3 py-1 rounded-md bg-white focus:outline-none">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </td>

                {/* Employment */}
                <td className="px-6 py-4">Permanent</td>

                {/* Email */}
                <td className="px-6 py-4">
                  <span className="text-brand cursor-pointer">
                    [email protected]
                  </span>
                </td>

                {/* Job Title */}
                <td className="px-6 py-4">Team Lead</td>

                {/* Manager */}
                <td className="px-6 py-4">Richard Wilson</td>

                {/* Team */}
                <td className="px-6 py-4">Designing</td>

                {/* Start Date */}
                <td className="px-6 py-4">Designing</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}