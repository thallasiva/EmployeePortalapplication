import React from "react";
import { DollarSign } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND, baseInp, inp } from "../constants";
import SectionHead from "./SectionHead";
import FormInput from "./FormInput";
import Field from "./Field";
import Row from "./Row";
import SalaryBreakdown from "./SalaryBreakdown";

const CompensationSection = React.memo(function CompensationSection({
  employee, editMode, form, formErrors, touched, set, touch, handleCtcChange, compBreakdown,
}) {
  return (
    <div className="emp-review-section">
      <SectionHead icon={DollarSign} title="Compensation" />
      {editMode ? (
        <div>
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px", marginBottom: 16 })}>
            <div>
              <Field label="CTC (Annual ₹)" error={formErrors.ctc} touched={touched.ctc}>
                <input
                  type="number"
                  min={0}
                  value={form.ctc ?? ""}
                  onChange={(e) => handleCtcChange(e.target.value)}
                  onBlur={touch("ctc")}
                  placeholder="e.g. 600000"
                  className={cssClass({
                    ...inp,
                    borderColor: touched.ctc && formErrors.ctc ? "#dc2626" : BRAND,
                    outline: `1px solid ${touched.ctc && formErrors.ctc ? "#dc2626" : BRAND}`,
                    background: touched.ctc && formErrors.ctc ? "#fff5f5" : "#fff",
                  })}
                />
                <div className={cssClass({ fontSize: 11, color: "#6b7280", marginTop: 4 })}>
                  Enter Annual CTC — Base Salary auto-calculates
                </div>
              </Field>
            </div>
            <div>
              <Field label="Base Salary (Monthly ₹)" error={formErrors.base_salary} touched={touched.base_salary}>
                <input
                  type="number"
                  min={0}
                  value={form.base_salary ?? ""}
                  onChange={(e) => set("base_salary")(e.target.value)}
                  onBlur={touch("base_salary")}
                  placeholder="Auto-calculated"
                  className={cssClass(baseInp(touched.base_salary && formErrors.base_salary))}
                />
                <div className={cssClass({ fontSize: 11, color: "#6b7280", marginTop: 4 })}>
                  Or enter directly to override
                </div>
              </Field>
            </div>
            <FormInput label="Benefits Plan" value={form.benefits_plan} onChange={set("benefits_plan")} />
          </div>
          {Number(form.base_salary) > 0 && <SalaryBreakdown bk={compBreakdown} />}
        </div>
      ) : (
        <dl className="emp-review-grid">
          <Row label="CTC (Annual)" value={employee.ctc ? `₹ ${Number(employee.ctc).toLocaleString("en-IN")}` : null} />
          <Row label="Base Salary" value={employee.base_salary ? `₹ ${Number(employee.base_salary).toLocaleString("en-IN")}` : null} />
          <Row label="Benefits Plan" value={employee.benefits_plan} />
        </dl>
      )}
    </div>
  );
});

export default CompensationSection;
