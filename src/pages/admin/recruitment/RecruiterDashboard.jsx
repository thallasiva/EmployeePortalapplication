import { Briefcase, CalendarCheck, FileCheck, Users } from "lucide-react";
import Card from "./Card";
import { CANDIDATES, JOB_REQUESTS, statGridClass } from "./data";
import DataTable from "./DataTable";
import Stat from "./Stat";

function RecruiterDashboard({ recruiterKey })
{
  const myJobs = JOB_REQUESTS.filter((job) => job["Select Recruiter"] === recruiterKey);
  const myCandidates = CANDIDATES.filter((candidate) => candidate.Recruiter === recruiterKey);
  return (
    <>
      <div className={statGridClass}>
        <Stat icon={Briefcase} label="My Tasks" value={myJobs.length} note="Work in Progress" />
        <Stat icon={Users} label="My Candidates" value={myCandidates.length} note="Profiles uploaded" tone="indigo" />
        <Stat icon={CalendarCheck} label="Schedule Interview" value="2" note="Today" tone="green" />
        <Stat icon={FileCheck} label="Feedback Pending" value="1" note="Submit feedback" tone="red" />
      </div>
      <Card title="My Tasks">
        <DataTable columns={["Job ID", "Job Title", "Client", "My Tasks", "Status"]} rows={myJobs} />
      </Card>
    </>
  );
}
export default RecruiterDashboard;