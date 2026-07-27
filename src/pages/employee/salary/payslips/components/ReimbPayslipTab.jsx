import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const ReimbPayslipTab = React.memo(function ReimbPayslipTab() {
  return (
    <div className={cssClass({ border: "1px solid #e0e0e0", borderRadius: 8, padding: 60, textAlign: "center", background: "#fafbfc", minHeight: 260 })}>
      <div className={cssClass({ fontSize: 52, marginBottom: 12 })}>📋</div>
      <p className={cssClass({ color: "#94a3b8", fontSize: 13 })}>
        Looks like your reimbursement payslip has not been generated yet. Drop by later and we'll have it ready for you.
      </p>
    </div>
  );
});

export default ReimbPayslipTab;
