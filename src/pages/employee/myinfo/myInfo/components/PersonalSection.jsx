import React from "react";
import { User } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate, calcAge } from "../utils";
import Field from "./Field";
import InfoCard from "./InfoCard";
import { Grid } from "./Grid";

const PersonalSection = React.memo(function PersonalSection({ e, ci, revealed, toggle }) {
  const emp_name = [e.first_name, e.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div id="section-personal">
      <InfoCard id="card-profile" title="Profile">
        <div className={cssClass({ display: "flex", gap: 24, alignItems: "flex-start" })}>
          <div className={cssClass({ width: 70, height: 70, borderRadius: "50%", overflow: "hidden", background: "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e2e8f0" })}>
            {e.profile_photo
              ? <img src={e.profile_photo} alt="avatar" className={cssClass({ width: "100%", height: "100%", objectFit: "cover" })} />
              : <User size={30} color="#94a3b8" />}
          </div>
          <div className={cssClass({ flex: 1 })}>
            <Grid cols={3}>
              <Field label="Name"              value={emp_name} />
              <Field label="Employee ID"       value={e.emp_code} />
              <Field label="Company Email"     value={e.email} color="#f18200" />
              <Field label="Location"          value={e.location} />
              <Field label="Primary Contact No." value={e.mobile} masked show={revealed.mobile} onToggle={() => toggle("mobile")} />
              <Field label="Extension"         value={null} />
            </Grid>
          </div>
        </div>
      </InfoCard>

      <InfoCard id="card-personal" title="Personal">
        <Grid cols={3}>
          <Field label="Blood Group"     value={e.blood_group}     masked show={revealed.blood_group}     onToggle={() => toggle("blood_group")} />
          <Field label="Date of Birth"   value={e.dob ? `${fmtDate(e.dob)} (${calcAge(e.dob)})` : null} masked show={revealed.dob} onToggle={() => toggle("dob")} />
          <Field label="Nationality"     value="Indian" />
          <Field label="Marital Status"  value={e.marital_status}  masked show={revealed.marital_status}  onToggle={() => toggle("marital_status")} />
          <Field label="Marriage Date"   value={null} />
          <Field label="Spouse"          value={e.spouse_name} />
          <Field label="Place of Birth"  value={null} />
          <Field label="Residential Status" value={null} />
          <Field label="Father Name"     value={e.father_name} />
          <Field label="Religion"        value={null} />
          <Field label="Physically Challenged" value="No" />
          <Field label="International Employee" value="No" />
          <Field label="Height"          value={null} />
          <Field label="Weight"          value={null} />
          <Field label="Identification Mark" value={null} />
          <Field label="Hobby"           value={null} />
          <Field label="Caste"           value={null} />
        </Grid>
      </InfoCard>

      <InfoCard id="card-address" title="Address">
        <div className={cssClass({ marginBottom: 12 })}>
          <span className={cssClass({ fontSize: 12, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 12px", color: "#475569", fontWeight: 600 })}>
            Emergency Contact / Address ▾
          </span>
        </div>
        <Grid cols={3}>
          <Field label="Address"      value={ci.current_address} />
          <Field label="Name"         value={ci.emergency_contact_name} />
          <Field label="Email"        value={ci.personal_email} />
          <Field label="Phone 1"      value={null} />
          <Field label="Phone 2"      value={null} />
          <Field label="Mobile"       value={ci.emergency_contact_phone} masked show={revealed.ec_mobile} onToggle={() => toggle("ec_mobile")} />
          <Field label="Extension"    value={null} />
          <Field label="Fax"          value={null} />
          <Field label="Relationship" value={ci.emergency_contact_relation} />
        </Grid>
      </InfoCard>

      <InfoCard id="card-education" title="Education">
        {e.educational_qualification ? (
          <Grid cols={3}>
            <Field label="Degree"    value={e.educational_qualification} />
            <Field label="Duration"  value={null} />
            <Field label="Institute" value={null} />
            <Field label="Grade"     value={null} />
          </Grid>
        ) : (
          <p className={cssClass({ color: "#94a3b8", fontSize: 13 })}>No education records found.</p>
        )}
      </InfoCard>
    </div>
  );
});

export default PersonalSection;
