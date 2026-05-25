// Feedback.jsx

import React, { useState } from "react";
import
{
    MessageSquare,
    Star,
    Send,
} from "lucide-react";
import RequestFeedbackModal from "./RequestFeedbackModal";

const Feedback = () =>
{
    const [openModal, setOpenModal] =
        useState(false);
    return (
        <div className="space-y-6 ">

            {/* HEADER */}
            {/* RIGHT BUTTONS */}
            <div className="flex items-center w-full">

                    {/* RIGHT SIDE BUTTONS */}
                <div className="flex items-center gap-5 pr-2 ml-auto">

                    <button
                        onClick={() =>
                            setOpenModal(true)
                        }
                        className="
                bg-[#3f5bd8]
                hover:bg-[#334cc2]
                text-white
                text-[16px]
                font-medium
                px-7
                py-3
                rounded-lg
                shadow-sm
            "
                    >
                        Request Feedback
                    </button>

                    <button
                        onClick={() =>
                            setOpenModal(true)
                        }
                        className="
                bg-[#3f5bd8]
                hover:bg-[#334cc2]
                text-white
                text-[16px]
                font-medium
                px-7
                py-3
                rounded-lg
                shadow-sm
            "
                    >
                        Give Feedback
                    </button>

                </div>

            </div>
            <div className="flex items-center justify-between">

                {/* TOP SECTION */}

                <div className="flex items-center justify-between border-b border-gray-300 pb-0">

                    {/* LEFT TABS */}
                    <div className="flex items-center">

                        <button
                            className="
                px-6
                py-4
                text-[#3f5bd8]
                border-b-2
                border-[#3f5bd8]
                text-[17px]
                font-medium
            "
                        >
                            Received
                        </button>

                        <button
                            className="
                px-6
                py-4
                text-gray-700
                text-[17px]
                font-medium
            "
                        >
                            Given
                        </button>

                        <button
                            className="
                px-6
                py-4
                text-gray-700
                text-[17px]
                font-medium
            "
                        >
                            Pending Requests
                        </button>

                        <button
                            className="
                px-6
                py-4
                text-gray-700
                text-[17px]
                font-medium
            "
                        >
                            Drafts
                        </button>

                    </div>



                </div>

                {/* <div className="flex justify-end gap-3">

                    <button
                        className="bg-brand hover:bg-brand-600 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                        onClick={() =>
                            setOpenModal(true)
                        }
                    >
                        <Send size={18} />
                        Request Feedback
                    </button>

                    <button
                        className="bg-brand hover:bg-brand-600 text-white px-5 py-2 rounded-lg flex items-center gap-2"
                        onClick={() =>
                            setOpenModal(true)
                        }
                    >
                        Give Feedback
                    </button>

                </div> */}


                <RequestFeedbackModal
                    open={openModal}
                    onClose={() =>
                        setOpenModal(false)
                    }
                />

            </div>

            {/* OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-brand" />

                        <div>
                            <h2 className="text-lg font-semibold">
                                Total Feedback
                            </h2>

                            <p className="text-3xl font-bold mt-2">
                                18
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3">
                        <Star className="text-yellow-500" />

                        <div>
                            <h2 className="text-lg font-semibold">
                                Average Rating
                            </h2>

                            <p className="text-3xl font-bold mt-2">
                                4.8
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-5">
                    <div className="flex items-center gap-3">
                        <Send className="text-brand" />

                        <div>
                            <h2 className="text-lg font-semibold">
                                Requests Sent
                            </h2>

                            <p className="text-3xl font-bold mt-2">
                                6
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* FEEDBACK LIST */}
            <div className="bg-white rounded-2xl shadow p-6">

                <h2 className="text-xl font-semibold mb-5">
                    Recent Feedback
                </h2>

                <div className="space-y-4">

                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="border rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between">

                                <div className="flex gap-4">

                                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand">
                                        RK
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">
                                            Rahul Kumar
                                        </h3>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Excellent communication
                                            and quick problem
                                            solving skills.
                                        </p>

                                        <p className="text-xs text-gray-400 mt-2">
                                            Yesterday
                                        </p>
                                    </div>

                                </div>

                                <div className="flex text-yellow-500">
                                    ⭐⭐⭐⭐⭐
                                </div>

                            </div>
                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
};

export default Feedback;