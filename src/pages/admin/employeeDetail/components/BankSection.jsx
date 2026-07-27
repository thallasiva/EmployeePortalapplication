import React from "react";
import { CreditCard } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { ACCOUNT_TYPE_OPTIONS, PAYMENT_TYPE_OPTIONS } from "../constants";
import SectionHead from "./SectionHead";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import Row from "./Row";

const BankSection = React.memo(function BankSection({
  bd, editMode, bankForm, setB,
}) {
  return (
    <div className="emp-review-section">
      <SectionHead icon={CreditCard} title="Bank Details" />
      {editMode ? (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
          <FormInput label="Bank Name" value={bankForm.bank_name} onChange={setB("bank_name")} />
          <FormInput label="Account Number" value={bankForm.account_number} onChange={setB("account_number")} />
          <FormSelect label="Account Type" value={bankForm.account_type} onChange={setB("account_type")} placeholder="Select" options={ACCOUNT_TYPE_OPTIONS} />
          <FormInput label="Bank Branch" value={bankForm.bank_branch} onChange={setB("bank_branch")} />
          <FormInput label="IFSC Code" value={bankForm.ifsc_code} onChange={setB("ifsc_code")} />
          <FormInput label="DD Payable At" value={bankForm.dd_payable_at} onChange={setB("dd_payable_at")} />
          <FormInput label="Name As Per Bank" value={bankForm.account_holder_name} onChange={setB("account_holder_name")} />
          <FormSelect label="Payment Type" value={bankForm.payment_type} onChange={setB("payment_type")} placeholder="Select" options={PAYMENT_TYPE_OPTIONS} />
          <FormInput label="PAN Number" value={bankForm.pan_number} onChange={setB("pan_number")} />
          <FormInput label="UAN Number" value={bankForm.uan_number} onChange={setB("uan_number")} />
        </div>
      ) : (
        <dl className="emp-review-grid">
          <Row label="Bank Name" value={bd?.bank_name} />
          <Row label="Account Number" value={bd?.account_number} />
          <Row label="Account Type" value={bd?.account_type} />
          <Row label="Bank Branch" value={bd?.bank_branch} />
          <Row label="IFSC Code" value={bd?.ifsc_code} />
          <Row label="DD Payable At" value={bd?.dd_payable_at} />
          <Row label="Name As Per Bank" value={bd?.account_holder_name} />
          <Row label="Payment Type" value={bd?.payment_type} />
          <Row label="PAN Number" value={bd?.pan_number} />
          <Row label="UAN Number" value={bd?.uan_number} />
        </dl>
      )}
    </div>
  );
});

export default BankSection;
