import { useState } from "react";
import
    {
        CalendarDays,
        ChevronDown,
        Paperclip,
        PlusCircle,
        UserCircle2,
    } from "lucide-react";

export default function LeaveApply()
{
    const [activeTab, setActiveTab] = useState("apply");

    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4">
                <h1 className="text-[20px] font-semibold text-[#1f2937]">
                    Leave Apply
                </h1>

                <div className="flex items-center gap-3">
                    <button className="text-[14px] text-[#64748b]">
                        Quick Links
                    </button>

                    <button className="text-[#94a3b8]">🔔</button>
                    <button className="text-[#94a3b8]">⏻</button>
                </div>
            </div>

            {/* BODY */}

            <div className="flex">
                {/* SIDEBAR */}

                <div className="w-[240px] px-4 py-5">
                    <div className="space-y-5">
                        <button className="block text-[14px] text-[#2563eb] font-medium">
                            Leave
                        </button>

                        <button className="block text-[14px] text-[#64748b] hover:text-[#2563eb]">
                            Restricted Holiday
                        </button>

                        <button className="block text-[14px] text-[#64748b] hover:text-[#2563eb]">
                            Leave Cancel
                        </button>

                        <button className="block text-[14px] text-[#64748b] hover:text-[#2563eb]">
                            Comp Off Grant
                        </button>
                    </div>
                </div>

                {/* CONTENT */}

                <div className="flex-1 p-5">
                    {/* TABS */}

                    <div className="flex justify-center mb-5">
                        <div className="flex border border-[#d6dce5] rounded overflow-hidden">
                            <button
                                onClick={() => setActiveTab("apply")}
                                className={`
                  min-w-[150px]
                  h-[42px]
                  text-[14px]
                  font-medium
                  ${activeTab === "apply"
                                        ? "bg-[#2ea7ff] text-white"
                                        : "bg-white text-[#64748b]"
                                    }
                `}
                            >
                                Apply
                            </button>

                            <button
                                onClick={() => setActiveTab("pending")}
                                className={`
                  min-w-[150px]
                  h-[42px]
                  text-[14px]
                  font-medium
                  border-l
                  border-r
                  border-[#d6dce5]
                  ${activeTab === "pending"
                                        ? "bg-[#2ea7ff] text-white"
                                        : "bg-white text-[#64748b]"
                                    }
                `}
                            >
                                Pending
                            </button>

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`
                  min-w-[150px]
                  h-[42px]
                  text-[14px]
                  font-medium
                  ${activeTab === "history"
                                        ? "bg-[#2ea7ff] text-white"
                                        : "bg-white text-[#64748b]"
                                    }
                `}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    {/* FORM CARD */}

                    <div className="bg-white border border-[#dce3eb]">
                        {/* INFO BAR */}

                        <div className="bg-[#fff9db] px-5 py-3 text-[13px] text-[#6b7280] flex justify-between">
                            <span>
                                Leave is earned by an employee and granted by the employer to
                                take time off work.
                            </span>

                            <button className="text-[#2563eb]">Hide</button>
                        </div>

                        {/* FORM */}

                        <div className="p-6">
                            <h2 className="text-[16px] font-medium text-[#374151] mb-6">
                                Applying for Leave
                            </h2>

                            <div className="grid grid-cols-12 gap-5">
                                {/* LEFT FORM */}

                                <div className="col-span-8">
                                    {/* LEAVE TYPE */}

                                    <div className="mb-5">
                                        <label className="block text-[13px] text-[#6b7280] mb-2">
                                            Leave type <span className="text-red-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <select
                                                className="
                          w-full
                          h-[42px]
                          border
                          border-[#cfd8e3]
                          rounded
                          px-4
                          text-[14px]
                          text-[#374151]
                          appearance-none
                          outline-none
                          bg-white
                        "
                                            >
                                                <option>Select type</option>
                                                <option>Casual Leave</option>
                                                <option>Sick Leave</option>
                                                <option>Earned Leave</option>
                                            </select>

                                            <ChevronDown
                                                size={16}
                                                className="absolute right-4 top-3 text-[#94a3b8]"
                                            />
                                        </div>
                                    </div>

                                    {/* DATES */}

                                    <div className="grid grid-cols-2 gap-5">
                                        {/* FROM */}

                                        <div>
                                            <label className="block text-[13px] text-[#6b7280] mb-2">
                                                From date{" "}
                                                <span className="text-red-500">*</span>
                                            </label>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Select date"
                                                    className="
                            w-full
                            h-[42px]
                            border
                            border-[#cfd8e3]
                            rounded
                            px-4
                            text-[14px]
                            outline-none
                          "
                                                />

                                                <CalendarDays
                                                    size={16}
                                                    className="absolute right-4 top-3 text-[#94a3b8]"
                                                />
                                            </div>
                                        </div>

                                        {/* SESSION */}

                                        <div>
                                            <label className="block text-[13px] text-[#6b7280] mb-2">
                                                Session
                                            </label>

                                            <div className="relative">
                                                <select
                                                    className="
                            w-full
                            h-[42px]
                            border
                            border-[#cfd8e3]
                            rounded
                            px-4
                            appearance-none
                            outline-none
                            text-[14px]
                          "
                                                >
                                                    <option>Session 1</option>
                                                    <option>Session 2</option>
                                                </select>

                                                <ChevronDown
                                                    size={16}
                                                    className="absolute right-4 top-3 text-[#94a3b8]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TO DATE */}

                                    <div className="grid grid-cols-2 gap-5 mt-5">
                                        <div>
                                            <label className="block text-[13px] text-[#6b7280] mb-2">
                                                To date{" "}
                                                <span className="text-red-500">*</span>
                                            </label>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Select date"
                                                    className="
                            w-full
                            h-[42px]
                            border
                            border-[#cfd8e3]
                            rounded
                            px-4
                            text-[14px]
                            outline-none
                          "
                                                />

                                                <CalendarDays
                                                    size={16}
                                                    className="absolute right-4 top-3 text-[#94a3b8]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[13px] text-[#6b7280] mb-2">
                                                Session
                                            </label>

                                            <div className="relative">
                                                <select
                                                    className="
                            w-full
                            h-[42px]
                            border
                            border-[#cfd8e3]
                            rounded
                            px-4
                            appearance-none
                            outline-none
                            text-[14px]
                          "
                                                >
                                                    <option>Session 2</option>
                                                    <option>Session 1</option>
                                                </select>

                                                <ChevronDown
                                                    size={16}
                                                    className="absolute right-4 top-3 text-[#94a3b8]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* APPLYING TO */}

                                    <div className="mt-6 flex items-center gap-3">
                                        <UserCircle2
                                            size={38}
                                            className="text-[#cbd5e1]"
                                        />

                                        <div>
                                            <p className="text-[13px] text-[#6b7280]">
                                                Applying to
                                            </p>

                                            <button className="text-[14px] text-[#2563eb]">
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* CC */}

                                    <div className="mt-6">
                                        <p className="text-[13px] text-[#6b7280] mb-3">
                                            CC to
                                        </p>

                                        <button className="flex items-center gap-2 text-[#2563eb] text-[14px]">
                                            <PlusCircle size={18} />
                                            Add
                                        </button>
                                    </div>

                                    {/* CONTACT */}

                                    <div className="mt-6">
                                        <label className="block text-[13px] text-[#6b7280] mb-2">
                                            Contact details
                                        </label>

                                        <input
                                            type="text"
                                            className="
                        w-full
                        h-[42px]
                        border
                        border-[#cfd8e3]
                        rounded
                        px-4
                        text-[14px]
                        outline-none
                      "
                                        />
                                    </div>

                                    {/* REASON */}

                                    <div className="mt-6">
                                        <label className="block text-[13px] text-[#6b7280] mb-2">
                                            Reason <span className="text-red-500">*</span>
                                        </label>

                                        <textarea
                                            rows={4}
                                            placeholder="Enter a reason"
                                            className="
                        w-full
                        border
                        border-[#cfd8e3]
                        rounded
                        p-4
                        text-[14px]
                        outline-none
                        resize-none
                      "
                                        />
                                    </div>

                                    {/* FILE */}

                                    <div className="mt-5 flex items-center gap-3">
                                        <button className="flex items-center gap-2 text-[#2563eb] text-[14px]">
                                            <Paperclip size={16} />
                                            Attach File
                                        </button>

                                        <p className="text-[12px] text-[#94a3b8]">
                                            File Types: pdf, xls, xlsx, doc, docx, txt,
                                            ppt, pptx, gif, jpg, jpeg, png
                                        </p>
                                    </div>

                                    {/* BUTTONS */}

                                    <div className="mt-8 flex justify-center gap-4">
                                        <button
                                            className="
                        h-[40px]
                        px-8
                        bg-[#2ea7ff]
                        hover:bg-[#1d95f0]
                        rounded
                        text-white
                        text-[14px]
                        font-medium
                      "
                                        >
                                            Submit
                                        </button>

                                        <button
                                            className="
                        h-[40px]
                        px-8
                        border
                        border-[#cfd8e3]
                        rounded
                        text-[#64748b]
                        text-[14px]
                        bg-white
                      "
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT SIDE */}

                                <div className="col-span-4 flex justify-end">
                                    <div className="mt-24 text-[14px] text-[#64748b] space-y-2">
                                        <p>
                                            Leave Balance:
                                            <span className="ml-2 font-medium text-[#111827]">
                                                12
                                            </span>
                                        </p>

                                        <p>
                                            Applying For:
                                            <span className="ml-2 font-medium text-[#111827]">
                                                2 Days
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EMPTY PAGES */}

                    {activeTab === "pending" && (
                        <div className="bg-white border border-[#dce3eb] h-[400px] flex items-center justify-center mt-5">
                            <p className="text-[#94a3b8] text-[18px]">
                                No Pending Leaves
                            </p>
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="bg-white border border-[#dce3eb] h-[400px] flex items-center justify-center mt-5">
                            <p className="text-[#94a3b8] text-[18px]">
                                No Leave History
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}