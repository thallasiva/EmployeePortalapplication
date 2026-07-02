import { Briefcase, CalendarCheck, FileCheck, Users } from "lucide-react";
import ReportLineChart from "../../../component/reports/ReportLineChart";
import Btn from "./Btn";
import Card from "./Card";
import Stat from "./Stat";
import { statGridClass } from "./data";
import { useNavigate } from "react-router-dom";

function ManagerDashboard()
{
    const router = useNavigate();
    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => router("/recruiter/recruitment/create-new")}
                    className="px-4 py-2 bg-orange-500 text-white rounded"
                >
                    New Recruitment
                </button>
                {/* <button className="inline-block px-4 py-2 bg-orange-500 text-white rounded mb-4 " onClick={() => router('/admin/recruitment/createNewRecruitment')}> New Recruitment </button> */}
            </div>
            <div className={statGridClass}>
                <Stat icon={Briefcase} label="Total Requirements" value="25" note="All open jobs" />
                <Stat icon={Briefcase} label="Open Requirements" value="12" note="Actively hiring" tone="green" />
                <Stat icon={Users} label="Total Candidates" value="150" note="Active profiles" tone="indigo" />
                <Stat icon={CalendarCheck} label="Interviews Today" value="18" note="Scheduled" tone="purple" />
                <Stat icon={FileCheck} label="Offers" value="12" note="Pending response" tone="orange" />
                <Stat icon={Users} label="Joined Employees" value="10" note="This month" tone="brand" />
            </div>

            <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1fr_420px]">
                <Card title="Recruitment Pipeline" action={<div className="text-xs text-gray-500">You Metrics</div>}>
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3.5">
                        {[
                            { label: "Applied", value: "35", color: "bg-blue-500" },
                            { label: "Screening", value: "28", color: "bg-indigo-500" },
                            { label: "Interview", value: "20", color: "bg-purple-500" },
                            { label: "Offer", value: "15", color: "bg-orange-500" },
                            { label: "Negotiation", value: "10", color: "bg-yellow-500" },
                            { label: "Accepted", value: "8", color: "bg-green-500" },
                            { label: "Rejected", value: "6", color: "bg-red-500" },
                            { label: "On Hold", value: "5", color: "bg-gray-500" },
                        ].map((stage) => (
                            <div key={stage.label} className="flex flex-col items-center gap-1">
                                <div className={`${stage.color} flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white`}>{stage.value}</div>
                                <div className="text-xs text-gray-600">{stage.label}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Today's Interviews" action={<Btn small>View Calendar</Btn>}>
                    <div className="space-y-2 p-3.5 text-xs text-gray-700">
                        {[
                            { time: "11:00 am", candidate: "React Developer", role: "L2 Technical Interview", interviewer: "Microsoft Teams", interviewerName: "Sarah Davis" },
                            { time: "04:00 pm", candidate: ".NET Developer", role: "HR Round", interviewer: "Microsoft Teams", interviewerName: "Emily Davis" },
                        ].map((interview) => (
                            <div key={interview.time} className="flex items-start justify-between rounded-md border-[0.5px] border-gray-200 bg-slate-50 p-2.5">
                                <div>
                                    <div className="font-semibold text-gray-900">{interview.time}</div>
                                    <div className="text-gray-600">{interview.candidate}</div>
                                    <div className="text-gray-500">{interview.role}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] font-semibold text-blue-600">{interview.interviewer}</div>
                                    <div className="text-[11px] text-gray-600">{interview.interviewerName}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    );
}
export default ManagerDashboard;