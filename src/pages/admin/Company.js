// import React from 'react';

// export default function Company() {
//   return (
//     <div className="space-y-6">
//       <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
//         <div>
//           <h2 className="text-xl font-semibold">Add Company</h2>
//           <p className="text-sm text-gray-500">Create a new company profile</p>
//         </div>
//         <button className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow">Add Document</button>
//       </div>

//       <div className="bg-white p-6 rounded-xl shadow">
//         <h3 className="font-semibold mb-4">Company Details</h3>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-medium mb-1">Company Name</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Company Name" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Email</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Phone</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Phone" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Website</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Website" />
//           </div>
//         </div>
//       </div>

//       <div className="bg-white p-6 rounded-xl shadow">
//         <h3 className="font-semibold mb-4">Address</h3>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-medium mb-1">Country</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Country" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">City</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="City" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Post - Code</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Post Code" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Street</label>
//             <input className="w-full border rounded-lg px-3 py-2" placeholder="Street" />
//           </div>
//         </div>
//       </div>

//       <div className="flex gap-4">
//         <button className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow">Add</button>
//         <button className="bg-red-500 text-white px-6 py-2 rounded-lg shadow">Cancel</button>
//       </div>
//     </div>
//   );
// }


import React, { useState } from 'react';
import CreateCompany from './CreateCompany';
import { useNavigate } from 'react-router-dom';
import { avatarDataUri } from '../../lib/placeholders';

export default function Company()
{

  const [createModal, setCreateModal] = useState(false);

  const navigate = useNavigate();

  const addCompany = () => {
  setCreateModal(true);
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-gray-500">Home / Company</span>
        <h2 className="font-semibold">Company</h2>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card */}
        <div className="bg-white rounded-xl shadow p-5 col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Focus Technologies</h3>
            <button className="text-brand" onClick={addCompany}>✏️</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-sm">Register Number</p>
                <p className="font-semibold text-brand">FT0070</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Incorporation Date</p>
                <p className="font-semibold text-brand">07 May 2000</p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">VAT Number</p>
                <p className="font-semibold text-brand">VT0070</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Address</p>
              <p className="font-semibold text-brand">
                Santiago de Surco<br />
                Av. Caminos del Inca 1325<br />
                United States
              </p>
            </div>
          </div>

          <button className="mt-5 bg-orange-500 text-white px-5 py-2 rounded-lg" onClick={addCompany}>
            Add Company Information
          </button>

          {
            createModal && (
              <CreateCompany createModal={createModal} setCreateModal={setCreateModal} />
            )
          }
        </div>

        {/* Right Card */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-4">Focus Technologies</h3>

          {["07448505267", "focustechnology.com", "[email protected]"].map((item, i) => (
            <div key={i} className="flex justify-between items-center border p-2 rounded mb-2">
              <span>{item}</span>
              <button className="text-brand" >✏️</button>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Documents</h3>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-lg">Add Document</button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Name</th>
              <th className="p-3">Date</th>
              <th className="p-3">Size</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(i => (
              <tr key={i} className="border-t">
                <td className="p-3">📄</td>
                <td className="p-3">Leave & Attendance Policy</td>
                <td className="p-3">05 Jan 2012</td>
                <td className="p-3">20 MB</td>
                <td className="p-3"><button className="text-red-600 border px-3 py-1 rounded">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Focus Technologies</h3>
            <button className="text-brand" >✏️ </button>
          </div>

          <p className="text-gray-500 text-sm mb-2">Head Office</p>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map(i => (
              <img key={i} src={avatarDataUri(i)} className="w-10 h-10 rounded-full border" alt="member" />
            ))}
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Overview</h3>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg" onClick={() => navigate('/dashboard/manage')}>Manage Teams sdddd</button>
          </div>

          <div className="flex justify-between text-sm mb-3">
            <p>Teams: <strong>6</strong></p>
            <p>People: <strong>7</strong></p>
          </div>

          <button className="bg-brand text-white px-4 py-2 rounded-lg" onClick={() => navigate('/dashboard/employee')}>People Directory</button>
        </div>
      </div>
    </div>
  );
}