import { BarChart3, Briefcase, CalendarCheck, FileCheck } from "lucide-react";
import Card from "./Card";
import DataTable from "./DataTable";
import Stat from "./Stat";
import { statGridClass } from "./data";

function AdminDashboard()
{
  return (
    <>
      <div className={statGridClass}>
        <Stat icon={Briefcase} label="Open Requirements" value="12" note="HR Manager owns action" />
        <Stat icon={CalendarCheck} label="Interviews Today" value="8" note="Recruiter scheduled" tone="indigo" />
        <Stat icon={FileCheck} label="Pending Offers" value="4" note="Approval / release watch" tone="green" />
        <Stat icon={BarChart3} label="Onboarded" value="10" note="This month" tone="purple" />
      </div>
      <Card title="Admin Tracking View">
        <DataTable
          columns={["Metric", "Current", "Owner", "Status"]}
          rows={[
            { Metric: "Job Request Creation", Current: "5 new", Owner: "HR / Recruiter Manager", Status: "Active" },
            { Metric: "Candidate Sourcing", Current: "18 profiles", Owner: "Recruiter", Status: "Work in Progress" },
            { Metric: "Offer Release", Current: "4 pending", Owner: "HR / Recruiter Manager", Status: "In Progress" },
            { Metric: "Onboarding Completion", Current: "10 completed", Owner: "HR / Recruiter Manager", Status: "Onboarded" },
          ]}
        />
      </Card>
      
    </>
  );
}

export default AdminDashboard;