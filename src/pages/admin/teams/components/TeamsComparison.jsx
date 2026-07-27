import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const TeamsComparison = React.memo(function TeamsComparison({ allTeams }) {
  if (!allTeams.length) return null;

  return (
    <section className="teams-comparison">
      <h2 className="teams-comparison__title">Team Comparison</h2>
      <table className="teams-comparison__table">
        <thead>
          <tr>
            <th>Team (Manager)</th>
            <th>Department</th>
            <th>Direct Reports</th>
            <th>Avg Tenure</th>
            <th>Lead</th>
          </tr>
        </thead>
        <tbody>
          {allTeams.map((team) => (
            <tr key={team.id}>
              <td className={cssClass({ fontWeight: 500 })}>{team.name}</td>
              <td>{team.department}</td>
              <td>{team.members.length}</td>
              <td>{team.avgTenure}</td>
              <td>{team.lead?.name || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});

export default TeamsComparison;
