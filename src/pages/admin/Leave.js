import React, { useState } from 'react';

export default function Leave()
{
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-gray-500">Home / Leave</span>
        <h2 className="font-semibold">Leave</h2>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold" onClick={() => setOpen(true)}>Focus Technologies</h3>
          <p className="text-sm text-gray-500">Head Office</p>
          <div className="flex -space-x-2 mt-3">
            <img className="w-8 h-8 rounded-full border" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" alt="" />
            <img className="w-8 h-8 rounded-full border" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" alt="" />
            <img className="w-8 h-8 rounded-full border" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" alt="" />
          </div>

          <div>


          {open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-white w-[400px] rounded-lg p-5 shadow-lg">

                <h2 className="text-lg font-semibold mb-3">
                  Edit member
                </h2>

                <div>
                  <input className="w-full border rounded-lg px-3 py-2" placeholder="Member name" />
                </div>

                <div className="flex justify-start gap-2 mt-3">
                  <div className="flex gap-4">
                    <button className="bg-orange-500 text-white px-6  rounded-lg shadow">Update</button>
                    <button className="bg-red-500 text-white px-6  rounded-lg shadow" onClick={() => setOpen(false)}>Cancel</button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
        </div>

        

        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-3">
          <img className="w-12 h-12 rounded-full" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" alt="Jenni Sims" />
          <p>Jenni Sims is working from home today.</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow flex items-center gap-3">
          <img className="w-12 h-12 rounded-full" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" alt="John Gibbs" />
          <p>John Gibbs is away today.</p>
        </div>
      </div>

      {/* Apply Leave */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="font-semibold mb-4">Apply Leaves</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">Leave Type *</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Select leave</option>
              <option>Casual Leave</option>
              <option>Sick Leave</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Remaining Leaves</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-100" value="10" disabled />
          </div>

          <div>
            <label className="text-sm font-medium">From</label>
            <input type="date" className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="text-sm font-medium">To</label>
            <input type="date" className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="text-sm font-medium">Half Day</label>
            <select className="w-full border rounded px-3 py-2">
              <option>Select</option>
              <option>First Half</option>
              <option>Second Half</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Remaining Leaves</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-100" value="2" disabled />
          </div>
        </div>

        <div className="mt-4">
          <textarea className="w-full border rounded px-3 py-2" rows="3" placeholder="Reason"></textarea>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="bg-brand text-white px-5 py-2 rounded">Apply</button>
          <button className="bg-red-500 text-white px-5 py-2 rounded">Cancel</button>
        </div>
      </div>

      {/* Leave Summary */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Leave Details</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Total Employees</th>
              <th className="p-2">First Half</th>
              <th className="p-2">Second Half</th>
              <th className="p-2">Working From Home</th>
              <th className="p-2">Absent</th>
              <th className="p-2">Today Away</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">05 May 2023</td>
              <td className="p-2">7</td>
              <td className="p-2">6</td>
              <td className="p-2">6</td>
              <td className="p-2">1</td>
              <td className="p-2">0</td>
              <td className="p-2">1</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Leave History */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Leave History</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Employee</th>
              <th className="p-2">Leave Type</th>
              <th className="p-2">From</th>
              <th className="p-2">To</th>
              <th className="p-2">Days</th>
              <th className="p-2">Remaining</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-t">
                <td className="p-2">Sean Black</td>
                <td className="p-2">Parental Leave</td>
                <td className="p-2">05 Dec 2019</td>
                <td className="p-2">07 Dec 2019</td>
                <td className="p-2">3</td>
                <td className="p-2">9</td>
                <td className="p-2">Personal</td>
                <td className="p-2"><span className="text-brand border border-brand px-2 rounded">Approved</span></td>
                <td className="p-2"><button className="text-red-500 border px-2 rounded">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
