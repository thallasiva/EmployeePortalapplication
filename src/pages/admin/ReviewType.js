import React from 'react'

const ReviewType = () =>
{
    const reviews = [
        { employee: 'Linda Craver',  status: 'In Progress' },
        { employee: 'Jenni Sims', status: 'Completed' },
    ];
    return (
        <div>
            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3">Review Name</th>
                            <th className="p-3">Reviewers</th>
                            <th className="p-3">Scheduled For</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map((item, index) => (
                            <tr key={index} className="border-t">
                                <td className="p-3">Employee Review</td>
                                <td className="p-3">{item.employee}</td>
                                <td className="p-3">
                                    <span
                                        className={`px-3 py-1 rounded border text-sm ${item.status === 'Completed'
                                            ? 'border-brand text-brand'
                                            : 'border-orange-500 text-orange-500'
                                            }`}
                                    >
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-3 space-x-2">
                                    <button className="border px-3 py-1 rounded text-brand">Edit</button>
                                    <button className="border px-3 py-1 rounded text-red-600">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ReviewType
