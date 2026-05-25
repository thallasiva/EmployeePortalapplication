import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const ReviewForm = () =>
{
    const reviews = [
        { employee: 'Linda Craver', from: '05 Dec 2019', to: '07 Dec 2019', status: 'In Progress' },
        { employee: 'Jenni Sims', from: '05 Dec 2019', to: '07 Dec 2019', status: 'Completed' },
    ];

    const navigate = useNavigate();



    return (

        <div className="space-y-6">


            {/* Table */}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3">Review Name</th>
                            <th className="p-3">Reviewers</th>
                            <th className="p-3">Begin On</th>
                            <th className="p-3">Due By</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map((item, index) => (
                            <tr key={index} className="border-t">
                                <td className="p-3">Employee Review</td>
                                <td className="p-3 flex "><img class="w-10 h-10 rounded-full border me-2" alt="imgs" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23f18200'/%3E%3Ctext x='20' y='24' text-anchor='middle' fill='white' font-size='14'%3EU%3C/text%3E%3C/svg%3E" />{item.employee}</td>
                                <td className="p-3">{item.from}</td>
                                <td className="p-3">{item.to}</td>
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
    );
}

export default ReviewForm
