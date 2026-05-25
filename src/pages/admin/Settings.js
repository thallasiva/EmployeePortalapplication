import React, { useState } from 'react';

export default function Settings() {
  const [tab, setTab] = useState('general');
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-gray-500">Home / Settings</span>
        <h2 className="font-semibold">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('general')}
          className={`px-5 py-2 rounded-lg font-medium ${
            tab === 'general' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setTab('timeoff')}
          className={`px-5 py-2 rounded-lg font-medium ${
            tab === 'timeoff' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Time Off
        </button>
      </div>

      {/* General Tab */}
      {tab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Logo */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-semibold mb-4">Company Logo</h3>
            <div className="border rounded-lg p-6 flex justify-center items-center relative">
              <span className="text-4xl font-bold text-brand">NAT IT</span>
              <button className="absolute top-3 right-3 text-brand">✏️</button>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-white p-5 rounded-xl shadow space-y-4">
            <h3 className="font-semibold">Your Company</h3>

            <div>
              <label className="block text-sm font-medium">Company Name</label>
              <input className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Company URL</label>
              <input className="w-full border rounded px-3 py-2" />
            </div>

            <button className="bg-brand text-white px-5 py-2 rounded-lg">Save Changes</button>
          </div>
        </div>
      )}

      {/* Time Off Tab */}
      {tab === 'timeoff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Default */}
            <div className="bg-white p-5 rounded-xl shadow">
              <h3 className="font-semibold mb-4">Company Default</h3>
              <p className="text-sm">Allowance: <strong>25 Days</strong></p>
              <p className="text-sm">Year Start: <strong>01 January</strong></p>
            </div>

            {/* Working Week */}
            <div className="bg-white p-5 rounded-xl shadow relative">
              <h3 className="font-semibold mb-4">Working Week</h3>
              <div className="flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                  <span key={day} className="bg-brand text-white px-3 py-1 rounded">{day}</span>
                ))}
                {['Sat', 'Sun'].map(day => (
                  <span key={day} className="bg-red-500 text-white px-3 py-1 rounded">{day}</span>
                ))}
              </div>
              <button onClick={() => setShowEdit(true)} className="absolute top-3 right-3 text-brand">✏️</button>
            </div>
          </div>

          {/* Working From Home */}
          <div className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Working From Home</h3>
              <p className="text-sm text-gray-500">Reflect your company's WFH policy.</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-brand relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          {/* Focus Technologies */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Focus Technologies</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Team Member</th>
                  <th className="p-2 text-left">Allowance</th>
                  <th className="p-2 text-left">Days Used</th>
                  <th className="p-2 text-left">Approvers</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">Danny Ward</td>
                  <td className="p-2">25</td>
                  <td className="p-2">20</td>
                  <td className="p-2">Robert Wilson</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Working Week Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Edit Working Week</h3>
              <button onClick={() => setShowEdit(false)}>❌</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                <label key={day} className="flex items-center gap-1">
                  <input type="checkbox" defaultChecked={!['Sat','Sun'].includes(day)} />
                  {day}
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="bg-orange-500 text-white px-4 py-2 rounded">Add</button>
              <button onClick={() => setShowEdit(false)} className="bg-red-500 text-white px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
