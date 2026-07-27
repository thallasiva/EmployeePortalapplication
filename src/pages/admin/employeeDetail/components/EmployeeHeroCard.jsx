import React from "react";
import { Mail, Phone } from "lucide-react";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { avatarDataUri } from "../../../../lib/placeholders";
import { EmployeeStatusBadge } from "../../../../utils/employeeStatus";
import { baseInp, inp } from "../constants";
import Field from "./Field";

const EmployeeHeroCard = React.memo(function EmployeeHeroCard({
  employee, editMode, form, formErrors, touched, set, touch,
}) {
  return (
    <div className={joinClasses("emp-wizard__card", cssClass({ marginBottom: 20 }))}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" })}>
        <img
          className="emp-card__avatar"
          src={avatarDataUri(employee.employee_id, 72)}
          alt={`${employee.first_name} ${employee.last_name || ""}`}
        />
        <div className={cssClass({ flex: 1 })}>
          {editMode ? (
            <div className={cssClass({ display: "flex", gap: 12, flexWrap: "wrap" })}>
              <div className={cssClass({ flex: 1, minWidth: 140 })}>
                <Field label="First Name" required error={formErrors.first_name} touched={touched.first_name}>
                  <input
                    value={form.first_name ?? ""}
                    onChange={(e) => set("first_name")(e.target.value)}
                    onBlur={touch("first_name")}
                    placeholder="First name"
                    className={cssClass(baseInp(touched.first_name && formErrors.first_name))}
                  />
                </Field>
              </div>
              <div className={cssClass({ flex: 1, minWidth: 140 })}>
                <Field label="Last Name">
                  <input
                    value={form.last_name ?? ""}
                    onChange={(e) => set("last_name")(e.target.value)}
                    placeholder="Last name"
                    className={cssClass(inp)}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <>
              <h2 className={cssClass({ margin: 0 })}>
                {employee.first_name} {employee.last_name}
              </h2>
              <p className={cssClass({ margin: "4px 0 0", color: "#64748b" })}>
                {employee.emp_job_title || "—"} · {employee.department_name || "General"}
              </p>
            </>
          )}
          <div className={cssClass({ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" })}>
            <EmployeeStatusBadge employee={employee} />
            <span className="emp-table__id">
              {employee.emp_code || `EMP${String(employee.employee_id).padStart(3, "0")}`}
            </span>
          </div>
        </div>
      </div>
      {!editMode && (
        <div className={joinClasses("emp-card__contact", cssClass({ marginTop: 14, flexDirection: "row", gap: "1.5rem" }))}>
          <span><Mail size={14} /> {employee.email}</span>
          <span><Phone size={14} /> {employee.mobile || "—"}</span>
        </div>
      )}
      {editMode && (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 })}>
          <Field label="Email" required error={formErrors.email} touched={touched.email}>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email")(e.target.value)}
              onBlur={touch("email")}
              className={cssClass(baseInp(touched.email && formErrors.email))}
            />
          </Field>
          <Field label="Mobile" required error={formErrors.mobile} touched={touched.mobile}>
            <input
              value={form.mobile ?? ""}
              onChange={(e) => set("mobile")(e.target.value)}
              onBlur={touch("mobile")}
              className={cssClass(baseInp(touched.mobile && formErrors.mobile))}
            />
          </Field>
        </div>
      )}
    </div>
  );
});

export default EmployeeHeroCard;
