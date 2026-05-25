import { useState } from "react";
import EmployeeBasicInformation from "../../component/EmployeeBasicInformation";
import ContactInformation from "../../component/ContactInformation";

export default function DetailsScreen()
{
    const [basicInfoOpen, setInfoOpen] = useState(false);
    const [contactInfoOpen, setContactInfoOpen] = useState(false);

    const basicInfo = () => setInfoOpen(true);
    const closeBasicInfo = () => contactInfoOpen(true);

    return (
        <div className="p-4 bg-gray-100 min-h-screen">

            {/* GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* BASIC INFO */}
                <div className="bg-white rounded-xl border shadow-sm">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="font-semibold text-xl">Basic Information</h2>

                        <div className="flex gap-2">
                            <button
                                className="w-8 h-8 rounded border text-brand"
                                onClick={basicInfo}
                            >
                                +
                            </button>
                            <button className="w-8 h-8 rounded border text-red-500">
                                🗑
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {[
                            ["Preferred Name", "Maria"],
                            ["First Name", "Maria"],
                            ["Last Name", "Cotton"],
                            ["Nationality", "American"],
                            ["Date of Birth", "05 May 1990"],
                            ["Gender", "Female"],
                            ["Blood Group", "A+"],
                        ].map(([k, v]) => (
                            <div key={k} className="grid grid-cols-2 text-sm">
                                <span className="text-gray-500">{k}</span>
                                <span className="text-right text-brand font-semibold">
                                    {v}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CONTACT INFO */}
                <div className="bg-white rounded-xl border shadow-sm">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="font-semibold text-xl">Contact Info</h2>

                        <div className="flex gap-2">
                            <button
                                className="w-8 h-8 rounded border text-brand"
                                onClick={() => setContactInfoOpen(true)}
                            >
                                +
                            </button>
                            <button className="w-8 h-8 rounded border text-red-500">
                                🗑
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {[
                            ["Phone Number", "987654321"],
                            ["Personal Email", "[email protected]"],
                            ["Secondary Number", "987654231"],
                            ["Website", "www.focustechnology.com"],
                            ["Linkedin", "#mariacotton"],
                        ].map(([k, v]) => (
                            <div key={k} className="grid grid-cols-2 text-sm">
                                <span className="text-gray-500">{k}</span>
                                <span className="text-right text-brand font-semibold">
                                    {v}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DATES */}
                <div className="space-y-4">

                    <div className="bg-white rounded-xl border shadow-sm">
                        <div className="p-4 border-b flex justify-between">
                            <h2 className="font-semibold text-xl">Dates</h2>

                            <button className="w-8 h-8 rounded border text-indigo-600">
                                ✎
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {[
                                ["Start Date", "01 Jan 2020"],
                                ["End Date", "—"],
                            ].map(([k, v]) => (
                                <div key={k} className="grid grid-cols-2 text-sm">
                                    <span className="text-gray-500">{k}</span>
                                    <span className="text-right text-brand font-semibold">
                                        {v}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CONTACT CARD */}
                    <div className="bg-white rounded-xl border shadow-sm">
                        <div className="p-4 border-b flex justify-between">
                            <h2 className="font-semibold text-xl">Contact</h2>
                            <span className="text-xs text-gray-500">New Type</span>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="relative">
                                <input
                                    placeholder="Add Start Date"
                                    className="w-full border rounded px-4 py-3 text-sm"
                                />
                                <span className="absolute right-3 top-3">📅</span>
                            </div>

                            <div className="relative">
                                <input
                                    placeholder="Add Visa Expiry Date"
                                    className="w-full border rounded px-4 py-3 text-sm"
                                />
                                <span className="absolute right-3 top-3">📅</span>
                            </div>

                            <button className="w-full bg-brand text-white py-3 rounded font-semibold">
                                Add A Key Date
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {basicInfoOpen && (
                <EmployeeBasicInformation basicInfo={basicInfo} />
            )}
            {
                contactInfoOpen && <ContactInformation  closeBasicInfo={closeBasicInfo}/>
            }
        </div>
    );
}