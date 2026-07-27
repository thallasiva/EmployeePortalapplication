import InterviewFeedback from "../InterviewFeedback";
import ScheduleInterview from "../ScheduleInterview";
import Btn from "./Btn";
import Card from "./Card";
import { footerActionsClass } from "./data";
import DataTable from "./DataTable";

function InterviewsTab({
  role,
  recruiterKey,
  selectedCandidate,
  handleScheduleInterview,
  interviews,
})
{

  const rows =
    role.id === 5
      ? interviews.filter(
        (i) => i.Recruiter === recruiterKey
      )
      : interviews;

  return (
    <>
      {role.id === 5 && (
        <Card title="Schedule Interview">

          <ScheduleInterview
            candidate={selectedCandidate}
            onSave={handleScheduleInterview}
          />

        </Card>
      )}

      <Card title="Interview History / Feedback">
        <DataTable
          columns={[
            "Candidate",
            "Level",
            "Type of Interview",
            "Interview Date",
            "time",
            "Subject",
            "Start/End time",
            "Participants",
            "Others",
            "Feedback Status",
            "Feedback Comments",
          ]}
          rows={rows}
        />
      </Card>

      {role.id === 5 && (
        <Card title="Submit Feedback">
          <InterviewFeedback />

          <div className={footerActionsClass}>
            <Btn>Save and Conduct Next Round</Btn>
            <Btn primary>Shortlist the Candidate</Btn>
          </div>
        </Card>
      )}
    </>
  );
}

export default InterviewsTab;
