import { Briefcase, CalendarCheck, FileCheck, Users } from "lucide-react";
import ReportDonutPanel from "../../../component/reports/ReportDonutPanel";
import ReportLineChart from "../../../component/reports/ReportLineChart";
import ReportStackedBarChart from "../../../component/reports/ReportStackedBarChart";
import Btn from "./Btn";
import Card from "./Card";
import { ADMIN_REPORTS_DONUTS, ADMIN_REPORTS_HIRING_TREND, ADMIN_REPORTS_LEAVE } from "./data";
import Stat from "./Stat";

function ReportsTab()
{
    return (
        <>
            <div >
                <div >
                    <Card title="Admin Report Overview" className="p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 p-4">
                            <Stat icon={Briefcase} label="Open Requirements" value="28" note="Hiring pipeline" />
                            <Stat icon={Users} label="Candidates" value="150" note="Active profiles" tone="indigo" />
                            <Stat icon={CalendarCheck} label="Interviews Today" value="18" note="Schedule ahead" tone="purple" />
                            <Stat icon={FileCheck} label="Offers Issued" value="12" note="Pending response" tone="green" />
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {ADMIN_REPORTS_DONUTS.slice(0, 2).map((chart) => (
                            <div
                                key={chart.title}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {chart.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Recruitment Analytics
                                    </p>
                                </div>

                                {/* Chart */}
                                <div className="p-5">
                                    <ReportDonutPanel
                                        title=""
                                        segments={chart.segments}
                                        centerLabel="Total"
                                        centerValue={chart.segments
                                            .reduce((sum, s) => sum + s.value, 0)
                                            .toString()}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* <Card title="Hiring Trend">
            <div className="p-4">
              <ReportLineChart
                labels={ADMIN_REPORTS_HIRING_TREND.labels}
                present={ADMIN_REPORTS_HIRING_TREND.present}
                absent={ADMIN_REPORTS_HIRING_TREND.absent}
              />
            </div>
          </Card> */}
                </div>
                {/* 
        <div className="space-y-3.5">
          <Card title="Leave Breakdown">
            <div className="p-4">
              <ReportStackedBarChart data={ADMIN_REPORTS_LEAVE} />
            </div>
          </Card>
        </div> */}
            </div>


        </>
    );
}
export default ReportsTab;