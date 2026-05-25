import React from 'react'

const CreateReviewer = () =>
{
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                <span className="text-gray-500">Home / Reviews</span>
                <h2 className="font-semibold">Create Review</h2>
            </div>

            {/* Setup Section */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4">Setup</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Review Name *</label>
                        <input className="w-full border rounded px-3 py-2" placeholder="Review Name" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Begins On</label>
                            <input type="date" className="w-full border rounded px-3 py-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Completion Date</label>
                            <input type="date" className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Review Frequency</label>
                        <input className="w-full border rounded px-3 py-2" placeholder="Enter frequency" />
                    </div>
                </div>
            </div>

            {/* Participants */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4">Participants</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <select className="border rounded px-3 py-2">
                        <option>Select Name</option>
                    </select>
                    <select className="border rounded px-3 py-2">
                        <option>Select Name</option>
                    </select>
                </div>
            </div>

            {/* Form Section */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4">Form</h3>
                <textarea className="w-full border rounded px-3 py-2 mb-3" rows="3" placeholder="Explain what this review is about..."></textarea>
                <textarea className="w-full border rounded px-3 py-2 mb-3" rows="3" placeholder="Add questions..."></textarea>
                <button className="border px-4 py-2 rounded text-brand">Add</button>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button className="bg-brand text-white px-6 py-2 rounded">Save</button>
                <button className="bg-red-500 text-white px-6 py-2 rounded">Cancel</button>
            </div>
        </div>
    );
}

export default CreateReviewer
