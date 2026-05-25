import React from 'react';
import { avatarDataUri } from '../../lib/placeholders';

const Offices = ({employees}) =>
{
    return (
        <div>
            <div className="space-y-6">
                {/* Create Office */}
                <div className="bg-white p-5 rounded-xl shadow flex gap-4 items-center">
                    <input
                        placeholder="Office Name"
                        className="flex-1 border rounded px-3 py-2"
                    />
                    <button className="bg-orange-500 text-white px-5 py-2 rounded-lg">
                        Create Office
                    </button>
                    <button className="bg-red-500 text-white px-5 py-2 rounded-lg">
                        Cancel
                    </button>
                </div>

                {/* Office Details */}
                <div className="bg-white rounded-xl shadow p-5">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-semibold">Focus Technologies</h3>
                            <p className="text-sm text-gray-500">Head Office</p>
                        </div>
                        <button className="text-brand">✏️</button>
                    </div>

                    {/* Members */}
                    <div className="flex items-center justify-between border rounded p-3 mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm">Members</span>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <img key={i} src={avatarDataUri(i)} className="w-8 h-8 rounded-full border" alt="" />
                                ))}
                            </div>
                        </div>
                        <button className="bg-gray-200 px-2 py-1 rounded">^</button>
                    </div>

                    {/* Table */}
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3">Line Manager</th>
                                <th className="p-3">Team</th>
                                <th className="p-3">Office</th>
                                <th className="p-3">Permissions</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-3 flex items-center gap-2">
                                        <img src={avatarDataUri(i + 1)} className="w-8 h-8 rounded-full" alt="" />
                                        {emp.name}
                                    </td>
                                    <td className="p-3">
                                        <span className="border px-2 py-1 rounded text-brand">Richard Wilson</span>
                                    </td>
                                    <td className="p-3">
                                        <span className="border px-2 py-1 rounded text-orange-500">{emp.team}</span>
                                    </td>
                                    <td className="p-3">Focus Technologies</td>
                                    <td className="p-3">Team Lead</td>
                                    <td className="p-3">
                                        <select className="border px-2 py-1 rounded text-brand">
                                            <option>Active</option>
                                            <option>Inactive</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Offices
