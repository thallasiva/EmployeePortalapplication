import React from "react";
import { MapPin } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import SectionHead from "./SectionHead";
import FormInput from "./FormInput";
import Row from "./Row";

const ContactSection = React.memo(function ContactSection({
  ci, editMode, contForm, setC,
}) {
  return (
    <div className="emp-review-section">
      <SectionHead icon={MapPin} title="Contact & Address" />
      {editMode ? (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
          <FormInput label="Contact Name" value={contForm.contact_name} onChange={setC("contact_name")} />
          <FormInput label="Personal Email" value={contForm.personal_email} onChange={setC("personal_email")} type="email" />
          <FormInput label="Alternate Mobile" value={contForm.alternate_mobile} onChange={setC("alternate_mobile")} />
          <FormInput label="Contact City" value={contForm.contact_city} onChange={setC("contact_city")} />
          <FormInput label="Contact Country" value={contForm.contact_country} onChange={setC("contact_country")} />
          <FormInput label="Emergency Contact Name" value={contForm.emergency_contact_name} onChange={setC("emergency_contact_name")} />
          <FormInput label="Emergency Contact Mobile" value={contForm.emergency_contact_phone} onChange={setC("emergency_contact_phone")} />
          <FormInput label="Permanent Address Line 1" value={contForm.permanent_address_line1} onChange={setC("permanent_address_line1")} />
          <FormInput label="Permanent Address Line 2" value={contForm.permanent_address_line2} onChange={setC("permanent_address_line2")} />
          <FormInput label="Permanent Address Line 3" value={contForm.permanent_address_line3} onChange={setC("permanent_address_line3")} />
        </div>
      ) : (
        <dl className="emp-review-grid">
          <Row label="Contact Name" value={ci?.contact_name} />
          <Row label="Contact Email" value={ci?.personal_email} />
          <Row label="Contact Mobile" value={ci?.alternate_mobile} />
          <Row label="Contact City" value={ci?.contact_city} />
          <Row label="Contact Country" value={ci?.contact_country} />
          <Row label="Emergency Contact Name" value={ci?.emergency_contact_name} />
          <Row label="Emergency Contact Mobile" value={ci?.emergency_contact_phone} />
          <Row label="Permanent Address Line 1" value={ci?.permanent_address_line1} />
          <Row label="Permanent Address Line 2" value={ci?.permanent_address_line2} />
          <Row label="Permanent Address Line 3" value={ci?.permanent_address_line3} />
        </dl>
      )}
    </div>
  );
});

export default ContactSection;
