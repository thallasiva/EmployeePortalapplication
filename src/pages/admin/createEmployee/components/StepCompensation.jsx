import React from "react";
import Field from "./Field";

const StepCompensation = React.memo(function StepCompensation({ values, errors, setField }) {
  return (
    <>
      <h2>Compensation</h2>
      <div className="emp-wizard__grid">
        <Field label="Annual Salary (USD)" required error={errors.ctc}>
          <input
            type="number"
            value={values.ctc}
            onChange={(e) => setField("ctc", e.target.value)}
            placeholder="e.g. 75000"
          />
        </Field>
        <Field label="Benefits Plan">
          <select
            value={values.benefits_plan}
            onChange={(e) => setField("benefits_plan", e.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="basic">Basic</option>
          </select>
        </Field>
      </div>
    </>
  );
});

export default StepCompensation;
