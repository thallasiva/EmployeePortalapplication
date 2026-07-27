import React from "react";
import Field from "./Field";

const StepPersonal = React.memo(function StepPersonal({ values, errors, setField }) {
  return (
    <>
      <h2>Personal Information</h2>
      <div className="emp-wizard__grid">
        <Field label="Employee ID" required error={errors.employee_id}>
          <input
            value={values.employee_id}
            onChange={(e) => setField("employee_id", e.target.value)}
            placeholder="e.g. EMP-007"
          />
        </Field>
        <Field label="Biometric ID">
          <input
            value={values.biometric_id}
            onChange={(e) => setField("biometric_id", e.target.value)}
            placeholder="Biometric / swipe card ID"
          />
        </Field>
        <Field label="First Name" required error={errors.first_name}>
          <input
            value={values.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            placeholder="First name"
          />
        </Field>
        <Field label="Last Name" required error={errors.last_name}>
          <input
            value={values.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            placeholder="Last name"
          />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input
            type="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="email@company.com"
          />
        </Field>
        <Field label="Phone" required error={errors.mobile}>
          <input
            value={values.mobile}
            onChange={(e) => setField("mobile", e.target.value)}
            placeholder="Phone number"
          />
        </Field>
      </div>
    </>
  );
});

export default StepPersonal;
