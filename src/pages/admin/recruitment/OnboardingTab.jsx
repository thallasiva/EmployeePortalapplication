import { Badge, Briefcase, CheckCircle, FileCheck, Users } from "lucide-react";
import Btn from "./Btn";
import { badgeColor, ONBOARDING_TASKS } from "./data";
import Stat from "./Stat";
import Card from "./Card";

function OnboardingTab()
{
  return (
    <>
      <div className="mb-3.5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Briefcase} label="Onboarded Candidates" value="14" note="Completed this month" />
        <Stat icon={CheckCircle} label="Pending Tasks" value="18" note="Needs action" tone="indigo" />
        <Stat icon={FileCheck} label="Offer Released" value="7" note="Awaiting acceptance" tone="green" />
        <Stat icon={Users} label="New Employees" value="4" note="Today" tone="purple" />
      </div>
      <Card title="Onboarding Tasks">
        <div className="overflow-x-auto rounded-md border-[0.5px] border-gray-200 bg-white">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500">
                {['Task', 'Description', 'Status', 'Action'].map((column) => (
                  <th key={column} className="whitespace-nowrap border-b-[0.5px] border-gray-200 px-3 py-2">{column}</th>
                ))}
            </tr>
            </thead>
            <tbody>
              {ONBOARDING_TASKS.map((row) => (
                <tr key={row.Task} className="border-b-[0.5px] border-gray-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-gray-700">{row.Task}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.Description}</td>
                  <td className="px-3 py-2 text-xs text-gray-700"><Badge color={badgeColor(row.Status)}>{row.Status}</Badge></td>
                  <td className="px-3 py-2 text-xs text-gray-700"><Btn small>{row.Action}</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
export default OnboardingTab;
