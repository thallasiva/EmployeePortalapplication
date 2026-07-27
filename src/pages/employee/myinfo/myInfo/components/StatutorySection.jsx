import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate, mask } from "../utils";
import Field from "./Field";
import InfoCard from "./InfoCard";
import { Grid, SectionLabel, Badge } from "./Grid";

const StatutorySection = React.memo(function StatutorySection({ e, bd, revealed, toggle }) {
  return (
    <div id="section-statutory" className={cssClass({ marginTop: 8 })}>
      <InfoCard id="card-bank-account" title="Bank Account">
        {bd.bank_name ? (
          <Grid cols={4}>
            <Field label="Bank Name"           value={bd.bank_name} />
            <Field label="Bank Account Number" value={bd.account_number} masked show={revealed.acc_no} onToggle={() => toggle("acc_no")} />
            <Field label="Bank Branch"         value={bd.bank_branch} />
            <Field label="IFSC Code"           value={bd.ifsc_code} />
          </Grid>
        ) : (
          <p className={cssClass({ color: "#94a3b8", fontSize: 13 })}>No bank account linked.</p>
        )}
      </InfoCard>

      <InfoCard id="card-pf-account" title="PF Account">
        <Grid cols={3}>
          <Field label="PF Number" value={bd.pf_number || e.pf_number} />
          <div className={cssClass({ marginBottom: 16 })}>
            <div className={cssClass({ fontSize: 11, color: "#f18200", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 })}>Eligibility</div>
            <Badge color="#16a34a">ELIGIBLE</Badge>
          </div>
          <Field label="UAN"         value={bd.uan_number} />
          <Field label="PF Join Date" value={fmtDate(e.pf_join_date)} />
          <div className={cssClass({ marginBottom: 16 })}>
            <div className={cssClass({ fontSize: 11, color: "#f18200", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 })}>KYC Status</div>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
              <input type="checkbox" readOnly checked={false} className={cssClass({ accentColor: "#f18200" })} />
              <span className={cssClass({ fontSize: 13, color: "#64748b" })}>Not Done</span>
            </div>
          </div>
          <Field label="KYC Document" value={null} />
        </Grid>
      </InfoCard>

      <InfoCard id="card-passport-and-visa" title="Passport and Visa">
        <SectionLabel label="Passport" />
        <p className={cssClass({ color: "#f18200", fontSize: 13, margin: "0 0 12px" })}>No data Found.</p>
        <SectionLabel label="Visa" />
        <p className={cssClass({ color: "#f18200", fontSize: 13, margin: 0 })}>No data Found.</p>
      </InfoCard>

      <InfoCard id="card-other-ids" title="Other IDs">
        {[
          { label: "AADHAAR",                       value: e.aadhaar_number,               key: "aadhaar", verified: false },
          { label: "Bank Details for Identification", value: bd.account_number,              key: "bankid",  verified: true },
          { label: "Permanent Account Number",       value: bd.pan_number || e.pan_number,  key: "pan",     verified: false },
        ].map((row) => (
          <div key={row.label} className={cssClass({ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9", gap: 8 })}>
            <div className={cssClass({ flex: 1 })}>
              <div className={cssClass({ fontSize: 11, color: "#f18200", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 })}>{row.label}</div>
              <div className={cssClass({ fontSize: 13, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 })}>
                {mask(row.value, revealed[row.key])}
                {row.value && (
                  <button onClick={() => toggle(row.key)} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" })}>
                    {revealed[row.key] ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                )}
              </div>
            </div>
            <Badge color={row.verified ? "#16a34a" : "#f18200"}>{row.verified ? "Verified" : "Unverified"}</Badge>
            <button className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#f18200", fontWeight: 600, fontSize: 12 })}>More</button>
          </div>
        ))}
      </InfoCard>
    </div>
  );
});

export default StatutorySection;
