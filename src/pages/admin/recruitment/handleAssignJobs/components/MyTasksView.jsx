import React from "react";
import Card from "../../Card";
import DataTable from "../../DataTable";
import { JOB_REQUESTS } from "../constants";

const MyTasksView = React.memo(function MyTasksView({ recruiterKey }) {
  const myJobs = JOB_REQUESTS.filter((job) => job["Select Recruiter"] === recruiterKey);

  return (
    <Card title="My Tasks">
      <DataTable
        columns={["Job ID", "Job Title", "Client", "My Tasks", "Status"]}
        rows={myJobs}
      />
    </Card>
  );
});

export default MyTasksView;
