import Btn from "./Btn";
import Card from "./Card";
import { footerActionsClass, OFFER_ROWS, ONBOARDING_ROWS } from "./data";
import DataTable from "./DataTable";
import FieldGrid from "./FieldGrid";

function OffersTab()
{
  return (
    <>
      <Card title="Release Offer">
        <FieldGrid fields={["Date of Joining", "CTC Amount", "Basic", "HRA", "Telephone/Internet Allowance", "Special Allowance", "Gross Salary", "PF Contribution", "Statutory Bonus", "Gratuity", "ESI", "Cost to Company", "CTC Amount in Words", "Designation"]} columns={4} />
        <div className={footerActionsClass}>
          <Btn>Save Structure</Btn>
          <Btn primary>Release</Btn>
        </div>
      </Card>
      <Card title="Offer & Onboarding">
        <DataTable columns={["Candidate", "Date of Joining", "CTC Amount", "Basic", "HRA", "Telephone/Internet Allowance", "Special Allowance", "Gross Salary", "PF Contribution", "Statutory Bonus", "Gratuity", "ESI", "Cost to Company", "CTC Amount in Words", "Designation", "Status"]} rows={OFFER_ROWS}  />
        {/*  */}
      </Card>
      <Card title="Finalizing Onboarding">
        <DataTable columns={["Candidate", "Current Status of Employee", "Effective Date", "Onboard", "Review Forms Submitted"]} rows={ONBOARDING_ROWS} />
      </Card>
    </>
  );
}

export default OffersTab;