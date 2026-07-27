import React from "react";
import { User } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { GENDER_OPTIONS, MARITAL_OPTIONS, BLOOD_GROUP_OPTIONS } from "../constants";
import { fmt } from "../utils";
import SectionHead from "./SectionHead";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import Row from "./Row";

const PersonalSection = React.memo(function PersonalSection({
  employee, editMode, form, set,
}) {
  return (
    <div className="emp-review-section">
      <SectionHead icon={User} title="Personal Information" />
      {editMode ? (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
          <FormSelect label="Gender" value={form.gender} onChange={set("gender")} placeholder="Select gender" options={GENDER_OPTIONS} />
          <FormInput label="Date of Birth" value={form.dob} onChange={set("dob")} type="date" />
          <FormSelect label="Marital Status" value={form.marital_status} onChange={set("marital_status")} placeholder="Select" options={MARITAL_OPTIONS} />
          <FormInput label="Father's Name" value={form.father_name} onChange={set("father_name")} />
          <FormInput label="Spouse Name" value={form.spouse_name} onChange={set("spouse_name")} />
          <FormSelect label="Blood Group" value={form.blood_group} onChange={set("blood_group")} placeholder="Select" options={BLOOD_GROUP_OPTIONS} />
        </div>
      ) : (
        <dl className="emp-review-grid">
          <Row label="Gender" value={employee.gender} />
          <Row label="Date of Birth" value={fmt(employee.dob)} />
          <Row label="Marital Status" value={employee.marital_status} />
          <Row label="Father's Name" value={employee.father_name} />
          <Row label="Spouse Name" value={employee.spouse_name} />
          <Row label="Blood Group" value={employee.blood_group} />
        </dl>
      )}
    </div>
  );
});

export default PersonalSection;
