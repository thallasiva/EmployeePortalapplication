import { useState } from "react";
import Btn from "./Btn";
import Card from "./Card";
import { CANDIDATES, footerActionsClass } from "./data";
import DataTable from "./DataTable";
import FieldGrid from "./FieldGrid";
import CandidateProfile from "./CandidateProfile";

function CandidatesTab({
    role,
    recruiterKey,
    selectedCandidate,
    setSelectedCandidate,
    setActive,
})
{
    const [showProfile, setShowProfile] = useState(false);

    const rows =
        role.id === 5
            ? CANDIDATES.filter(
                (candidate) => candidate.Recruiter === recruiterKey
            )
            : CANDIDATES;

    const tableRows = rows.map((row) => ({
        ...row,
        Action: (
            <div className="flex flex-wrap gap-2">
                <Btn
                    small
                    onClick={() =>
                    {
                        setSelectedCandidate(row);
                        setShowProfile(true);
                    }}
                >
                    View
                </Btn>

                <Btn
                    primary
                    small
                    onClick={() =>
                    {
                        setSelectedCandidate(row);
                        setActive("interviews");
                    }}
                >
                    Schedule Interview
                </Btn>
            </div>
        ),
    }));

    return (
        <>
            {/* Add Candidate Form */}
            {role.id === 5 && (
                <Card title="Add Candidate Details">
                    <FieldGrid
                        fields={[
                            "Job ID",
                            "Name",
                            "Email",
                            "Mobile",
                            "Total Experience",
                            "Relevant Experience",
                            "Current CTC",
                            "Expected CTC",
                            "Last Working Day (LWD)",
                            "Skill Set",
                            "Gender",
                            "Attach File",
                            "PIN Code",
                            "City",
                            "State",
                            "District",
                        ]}
                        columns={4}
                    />

                    <div className={footerActionsClass}>
                        <Btn>Cancel</Btn>
                        <Btn primary>Submit Candidate Info</Btn>
                    </div>
                </Card>
            )}

            {/* Candidate List */}
            <Card
                title={
                    role.id === 5
                        ? "My Candidates"
                        : "Recruiter-wise Candidates"
                }
            >
                <DataTable
                    columns={[
                        "Job ID",
                        "Name",
                        "Email",
                        "Mobile",
                        "Total Experience",
                        "Relevant Experience",
                        "Current CTC",
                        "Expected CTC",
                        "Last Working Day (LWD)",
                        "Skill Set",
                        "Gender",
                        "Attach File",
                        "PIN Code",
                        "City",
                        "State",
                        "District",
                        "Status",
                        "Action",
                    ]}
                    rows={tableRows}
                />
            </Card>

      

            <CandidateProfile open={showProfile}
                candidate={selectedCandidate}
                onClose={() =>
                {
                    setShowProfile(false);
                    setSelectedCandidate(null);
                }} />
        </>
    );
}

export default CandidatesTab;