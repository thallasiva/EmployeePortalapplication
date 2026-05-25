import React, { useState } from "react";

import
{
    X,
    Search,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    } from "lucide-react";

const RequestFeedbackModal = ({
    open,
    onClose,
}) =>
{
    const [message, setMessage] =
        useState("");


    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">

            {/* MODAL */}
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-5 border-b">

                    <h2 className="text-3xl font-semibold text-gray-700">
                        Request Feedback
                    </h2>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
                    >
                        <X size={24} />
                    </button>

                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">

                    {/* SEARCH */}
                    <div>
                        <label className="block text-lg text-gray-600 mb-3">
                            Search Employee
                            <span className="text-red-500">
                                *
                            </span>
                        </label>

                        <div className="flex items-center border rounded-full px-4 py-3 w-full md:w-[420px]">

                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                👤
                            </div>

                            <input
                                type="text"
                                placeholder="Search by Emp No. / Name"
                                className="flex-1 outline-none text-gray-600"
                            />

                            <Search
                                size={20}
                                className="text-gray-400"
                            />

                        </div>
                    </div>

                    {/* MESSAGE */}
                    <div>

                        <label className="block text-lg text-gray-600 mb-3">
                            Include a personalised
                            message
                            <span className="text-red-500">
                                *
                            </span>
                        </label>

                        {/* EDITOR */}
                        <div className="border rounded-xl overflow-hidden">

                            {/* TOOLBAR */}
                            <div className="flex items-center gap-5 px-4 py-3 border-b bg-gray-50">

                                <button>
                                    <Bold size={18} />
                                </button>

                                <button>
                                    <Italic size={18} />
                                </button>

                                <button>
                                    <Underline size={18} />
                                </button>

                                <button>
                                    <ListOrdered
                                        size={18}
                                    />
                                </button>

                                <button>
                                    <List size={18} />
                                </button>

                            </div>

                            {/* TEXTAREA */}
                            <textarea
                                rows={8}
                                value={message}
                                onChange={(e) =>
                                    setMessage(
                                        e.target.value
                                    )
                                }
                                placeholder="Type your message here..."
                                className="w-full p-4 outline-none resize-none text-gray-600"
                            />

                        </div>

                    </div>

                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-4 px-6 py-5 border-t bg-gray-50">

                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-brand font-medium hover:bg-brand-50 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        disabled={!message}
                        className={`px-8 py-2 rounded-lg text-white font-medium ${message
                            ? "bg-brand hover:bg-brand-600"
                            : "bg-gray-300 cursor-not-allowed"
                            }`}
                    >
                        Submit
                    </button>

                </div>

            </div>

        </div>
    );
};

export default RequestFeedbackModal;