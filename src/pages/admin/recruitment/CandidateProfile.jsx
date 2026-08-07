import Btn from "./Btn";
import Card from "./Card";
import { useState } from "react";
import { badgeColor } from "./data";
import Badge from "./Badge";

function CandidateProfile({ open,
    candidate,
    onClose })
{
    const [activeTab, setActiveTab] = useState("overview");
    if (!open || !candidate) return null;

    const tabs = [
        { key: "overview", label: "Overview" },
        { key: "timeline", label: "Timeline" },
        { key: "interviews", label: "Interviews" },
        { key: "documents", label: "Documents" },
        { key: "notes", label: "Notes" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative h-[90vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b bg-gradient-to-r transition bg-brand-500 to-indigo-600 px-6 py-4 text-white">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Candidate Performance
                        </h2>

                        <p className="text-sm text-blue-100">
                            Candidate Details & Interview Progress
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl hover:bg-red-500"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 p-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab.key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr] p-4">
                    <div className="rounded-md border-[0.5px] border-gray-200 bg-slate-50 p-4">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">{candidate.Name?.split(" ")[0][0]}</div>
                            <div>
                                <div className="text-base font-bold text-gray-900">{candidate.Name}</div>
                                <div className="text-xs text-gray-500">{candidate.Email}</div>
                                <div className="text-xs text-gray-500">{candidate.Mobile}</div>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-gray-600">
                            <div><span className="font-semibold text-gray-800">Current Company:</span> Tech Solutions</div>
                            <div><span className="font-semibold text-gray-800">Role Applied:</span> Java Developer</div>
                            <div><span className="font-semibold text-gray-800">Experience:</span> {candidate["Total Experience"]}</div>
                            <div><span className="font-semibold text-gray-800">Expected CTC:</span> {candidate["Expected CTC"]}</div>
                            <div><span className="font-semibold text-gray-800">Notice Period:</span> 30 Days</div>
                            <div><span className="font-semibold text-gray-800">Skills:</span> Java, Spring Boot, SQL, Microservices</div>
                            <div><span className="font-semibold text-gray-800">Status:</span> <Badge color={badgeColor(candidate.Status)}>{candidate.Status}</Badge></div>
                        </div>
                        <div className="mt-4 grid gap-2">
                            <Btn small>Download Resume</Btn>
                            <Btn small>Edit Candidate</Btn>
                        </div>
                    </div>

                    <div>
                        {activeTab === "overview" && (
                            <div className="grid gap-3">
                                <div className="rounded-md border-[0.5px] border-gray-200 bg-white p-4 text-xs text-gray-700">
                                    <div className="mb-2 font-semibold text-gray-900">Overview</div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div><span className="font-semibold text-gray-800">Job ID:</span> {candidate["Job ID"]}</div>
                                        <div><span className="font-semibold text-gray-800">Email:</span> {candidate.Email}</div>
                                        <div><span className="font-semibold text-gray-800">Mobile:</span> {candidate.Mobile}</div>
                                        <div><span className="font-semibold text-gray-800">City:</span> {candidate.City}</div>
                                        <div><span className="font-semibold text-gray-800">State:</span> {candidate.State}</div>
                                        <div><span className="font-semibold text-gray-800">District:</span> {candidate.District}</div>
                                    </div>
                                </div>
                                <div className="rounded-md border-[0.5px] border-gray-200 bg-white p-4 text-xs text-gray-700">
                                    <div className="mb-2 font-semibold text-gray-900">Education</div>
                                    <div>B.Tech - Computer Science</div>
                                    <div className="mt-3 font-semibold text-gray-900">Resume</div>
                                    <div className="text-blue-600">john_doe_resume.pdf</div>
                                </div>
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <Card title="Timeline">
                                <div className="space-y-3 p-4 text-xs text-gray-700">
                                    {[
                                        { label: "Applied", date: "01 Jul 2026" },
                                        { label: "Screening", date: "03 Jul 2026" },
                                        { label: "HR Interview", date: "05 Jul 2026" },
                                        { label: "Manager Round", date: "07 Jul 2026" },
                                        { label: "Offer", date: "10 Jul 2026" },
                                        { label: "Joined", date: "15 Jul 2026" },
                                    ].map((step) => (
                                        <div key={step.label} className="flex items-center gap-3">
                                            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                                            <div>
                                                <div className="font-semibold text-gray-900">{step.label}</div>
                                                <div className="text-xs text-gray-500">{step.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === "interviews" && (
                            <Card title="Interviews">
                                <div className="space-y-3 p-4 text-xs text-gray-700">
                                    <div className="grid gap-2 text-left sm:grid-cols-3">
                                        <div>
                                            <div className="font-semibold text-gray-900">Round</div>
                                            <div>HR Screen</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Date</div>
                                            <div>05 Jul 2026</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Status</div>
                                            <div><Badge color="green">Selected</Badge></div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 text-left sm:grid-cols-3">
                                        <div>
                                            <div className="font-semibold text-gray-900">Interviewer</div>
                                            <div>Alex Smith</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Mode</div>
                                            <div>Google Meet</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Feedback</div>
                                            <div>Strong technical fit</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeTab === "documents" && (
                            <Card title="Documents">
                                <div className="space-y-3 p-4 text-xs text-gray-700">
                                    {[
                                        { label: "Resume", file: "john_doe_resume.pdf" },
                                        { label: "ID Proof", file: "id_proof.pdf" },
                                        { label: "Experience Letter", file: "experience_letter.pdf" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center justify-between rounded-md border-[0.5px] border-gray-200 bg-slate-50 px-3 py-2">
                                            <div>
                                                <div className="font-semibold text-gray-900">{item.label}</div>
                                                <div className="text-xs text-gray-500">{item.file}</div>
                                            </div>
                                            <Btn small>Download</Btn>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {activeTab === "notes" && (
                            <Card title="Notes">
                                <div className="space-y-3 p-4 text-xs text-gray-700">
                                    <div className="rounded-md border-[0.5px] border-gray-200 bg-slate-50 p-3">
                                        <div className="font-semibold text-gray-900">Recruiter Notes</div>
                                        <div className="mt-2 text-gray-600">Candidate has strong backend skills and is available on short notice.</div>
                                    </div>
                                    <div className="rounded-md border-[0.5px] border-gray-200 bg-slate-50 p-3">
                                        <div className="font-semibold text-gray-900">Hiring Manager Notes</div>
                                        <div className="mt-2 text-gray-600">Good fit for Java Developer role, needs one more round for architecture evaluation.</div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CandidateProfile;
