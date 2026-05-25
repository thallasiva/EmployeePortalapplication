import { Upload, X } from 'lucide-react';
import React, { useState } from 'react'

const AddDocuments = ({ setShowModal,showModal }) =>
{

    const [docName, setDocName] = useState("");
    const [file, setFile] = useState(null);
    const [documents, setDocuments] = useState([
        { id: 1, name: "Passport.pdf" },
    ]);
    console.log("showModal",showModal);
    
    const handleAddDocument = () =>
    {
        if (!docName || !file) return;

        const newDoc = {
            id: Date.now(),
            name: file.name,
            description: docName,
        };

        setDocuments([...documents, newDoc]);
        setDocName("");
        setFile(null);
        setShowModal(false);
    };
    return (
        <div>
            {setShowModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="w-full max-w-md bg-white rounded-md shadow-xl border">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Add Document
                            </h2>

                            <button
                                onClick={() => setShowModal(false)}
                                className="text-red-500 border rounded-sm p-0.5"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 block mb-2">
                                    Document Description
                                </label>
                                <input
                                    type="text"
                                    value={docName}
                                    onChange={(e) => setDocName(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="w-full h-11 bg-indigo-700 text-white rounded-md flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-800">
                                    <Upload size={16} />
                                    Upload
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                </label>

                                {file && (
                                    <p className="text-xs text-gray-500 mt-2">{file.name}</p>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={handleAddDocument}
                                    className="flex-1 border border-orange-400 text-orange-500 py-2 rounded-lg hover:bg-orange-50"
                                >
                                    Add
                                </button>

                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AddDocuments
