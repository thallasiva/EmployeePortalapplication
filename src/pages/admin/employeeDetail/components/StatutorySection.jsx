import React from "react";
import { Building2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { fmt } from "../utils";
import SectionHead from "./SectionHead";
import FormInput from "./FormInput";
import Row from "./Row";

const StatutorySection = React.memo(function StatutorySection({
  employee, editMode, form, formErrors, touched, set, touch,
}) {
  return (
    <div className="emp-review-section">
      <SectionHead icon={Building2} title="Statutory & Identity" />
      {editMode ? (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
          <FormInput label="Aadhaar Number" value={form.aadhaar_number} onChange={set("aadhaar_number")} onBlur={touch("aadhaar_number")} error={formErrors.aadhaar_number} touched={touched.aadhaar_number} />
          <FormInput label="Name As Per Aadhaar" value={form.aadhaar_name} onChange={set("aadhaar_name")} />
          <FormInput label="Aadhaar Enrolment Number" value={form.aadhaar_enrolment_number} onChange={set("aadhaar_enrolment_number")} />
          <FormInput label="PF Number" value={form.pf_number} onChange={set("pf_number")} />
          <FormInput label="PF Join Date" value={form.pf_join_date} onChange={set("pf_join_date")} type="date" />
          <FormInput label="ESI Number" value={form.esi_number} onChange={set("esi_number")} />
          <FormInput label="Access Card Number" value={form.access_card_number} onChange={set("access_card_number")} />
          <FormInput label="Access Card From Date" value={form.access_card_from_date} onChange={set("access_card_from_date")} type="date" />
          <FormInput label="Access Card To Date" value={form.access_card_to_date} onChange={set("access_card_to_date")} type="date" />
        </div>
      ) : (
        <dl className="emp-review-grid">
          <Row label="Aadhaar Number" value={employee.aadhaar_number} />
          <Row label="Name As Per Aadhaar" value={employee.aadhaar_name} />
          <Row label="Aadhaar Enrolment Number" value={employee.aadhaar_enrolment_number} />
          <Row label="PF Number" value={employee.pf_number} />
          <Row label="PF Join Date" value={fmt(employee.pf_join_date)} />
          <Row label="ESI Number" value={employee.esi_number} />
          <Row label="Access Card Number" value={employee.access_card_number} />
          <Row label="Access Card From Date" value={fmt(employee.access_card_from_date)} />
          <Row label="Access Card To Date" value={fmt(employee.access_card_to_date)} />
        </dl>
      )}
    </div>
  );
});

export default StatutorySection;
