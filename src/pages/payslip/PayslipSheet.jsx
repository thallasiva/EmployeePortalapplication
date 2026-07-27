import React from "react";
import { formatINR } from "../../component/charts/InteractivePieChart";
import "./payslipPrint.css";import { cssClass, joinClasses } from "../../utils/classStyles";

const FY_MONTH_LABELS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];

const num = (value) => Number(value || 0).toLocaleString("en-IN");








export default function PayslipSheet({ data }) {
  if (!data) return null;

  const { employee, bank, company, earnings, deductions, tds, month_name, year, working_days, paid_days, lop_days } = data;
  const { rows: tdsRows = [], chapterVIA = [], incomeTax = {}, taxPaidByMonth = {} } = tds || {};

  return (
    <div className="payslip-print-sheet">
      {}
      <div className="payslip-print-header">
        <div>
          <h1>{company.company_name}</h1>
          {company.address && <p>{company.address}</p>}
        </div>
        <div className="payslip-print-logo">{company.company_name}</div>
      </div>

      <div className="payslip-print-title">
        Payslip for the month of {month_name} - {year}
      </div>

      {}
      <table className="payslip-print-table">
        <tbody>
          <tr>
            <td className="label-cell">Name</td>
            <td>{employee.employee_name}</td>
            <td className="label-cell">Employee No</td>
            <td>{employee.emp_code}</td>
          </tr>
          <tr>
            <td className="label-cell">Designation</td>
            <td>{employee.designation_name}</td>
            <td className="label-cell">Bank Name</td>
            <td>{bank.bank_name}</td>
          </tr>
          <tr>
            <td className="label-cell">Department</td>
            <td>{employee.department_name}</td>
            <td className="label-cell">Bank Account No.</td>
            <td>{bank.account_number}</td>
          </tr>
          <tr>
            <td className="label-cell">Location</td>
            <td>{employee.location}</td>
            <td className="label-cell">PAN</td>
            <td>{bank.pan_number}</td>
          </tr>
          <tr>
            <td className="label-cell">Effective Work Days</td>
            <td>{paid_days} / {working_days}</td>
            <td className="label-cell">UAN No.</td>
            <td>{bank.uan_number}</td>
          </tr>
          <tr>
            <td className="label-cell">LOP</td>
            <td>{lop_days}</td>
            <td className="label-cell">PF No.</td>
            <td>{employee.pf_number}</td>
          </tr>
        </tbody>
      </table>

      {}
      <div className="payslip-print-columns">
        <table className="payslip-print-table">
          <thead>
            <tr>
              <th>Earnings</th>
              <th className="payslip-print-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((row) =>
            <tr key={row.label}>
                <td>{row.label}</td>
                <td className="payslip-print-amount">{num(row.amount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <table className="payslip-print-table">
          <thead>
            <tr>
              <th>Deductions</th>
              <th className="payslip-print-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((row) =>
            <tr key={row.label}>
                <td>{row.label}</td>
                <td className="payslip-print-amount">{num(row.amount)}</td>
              </tr>
            )}
            {deductions.length === 0 &&
            <tr>
                <td>—</td>
                <td className="payslip-print-amount">0</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div className="payslip-print-columns">
        <table className={joinClasses("payslip-print-table", cssClass({ marginBottom: 0 }))}>
          <tbody>
            <tr className="payslip-print-total-row">
              <td>Total Earnings</td>
              <td className="payslip-print-amount">{num(data.total_earnings)}</td>
            </tr>
          </tbody>
        </table>
        <table className={joinClasses("payslip-print-table", cssClass({ marginBottom: 0 }))}>
          <tbody>
            <tr className="payslip-print-total-row">
              <td>Total Deduction</td>
              <td className="payslip-print-amount">{num(data.total_deductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {}
      <div className="payslip-print-netpay">
        <p className="netpay-line">Net Pay for the month : {formatINR(data.net_pay)}</p>
        <p className="netpay-words">({data.net_pay_words})</p>
      </div>

      {}
      {(data.eps || data.epf || data.edli || data.esi_employer) &&
      <>
          <div className="payslip-print-section-title">Employer Statutory Contributions (CTC)</div>
          <table className="payslip-print-table">
            <thead>
              <tr>
                <th>Component</th>
                <th className="payslip-print-amount">Rate</th>
                <th className="payslip-print-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.eps != null &&
            <tr>
                  <td>EPS — Employer Pension Fund (8.33%)</td>
                  <td className="payslip-print-amount">8.33%</td>
                  <td className="payslip-print-amount">{num(data.eps)}</td>
                </tr>
            }
              {data.epf != null &&
            <tr>
                  <td>EPF — Employer Provident Fund (3.67%)</td>
                  <td className="payslip-print-amount">3.67%</td>
                  <td className="payslip-print-amount">{num(data.epf)}</td>
                </tr>
            }
              {data.edli != null &&
            <tr>
                  <td>EDLI — Employees Deposit Linked Insurance (0.5%)</td>
                  <td className="payslip-print-amount">0.50%</td>
                  <td className="payslip-print-amount">{num(data.edli)}</td>
                </tr>
            }
              {data.esi_employer > 0 &&
            <tr>
                  <td>ESI — Employer Contribution (3.25%)</td>
                  <td className="payslip-print-amount">3.25%</td>
                  <td className="payslip-print-amount">{num(data.esi_employer)}</td>
                </tr>
            }
            </tbody>
          </table>
        </>
      }

      {}
      <div className="payslip-print-section-title">TDS Details</div>
      <table className="payslip-print-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="payslip-print-amount">Gross</th>
            <th className="payslip-print-amount">Exempt</th>
            <th className="payslip-print-amount">Taxable</th>
          </tr>
        </thead>
        <tbody>
          {tdsRows.map((row) =>
          <tr key={row.label}>
              <td>{row.label}</td>
              <td className="payslip-print-amount">{num(row.gross)}</td>
              <td className="payslip-print-amount">{row.exempt ? num(row.exempt) : "—"}</td>
              <td className="payslip-print-amount">{num(row.taxable)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {}
      <div className="payslip-print-section-title">Deduction Under Chapter VI-A</div>
      <table className="payslip-print-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="payslip-print-amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          {chapterVIA.length > 0 ?
          chapterVIA.map((row) =>
          <tr key={row.label}>
                <td>{row.label}</td>
                <td className="payslip-print-amount">{num(row.amount)}</td>
              </tr>
          ) :

          <tr>
              <td>—</td>
              <td className="payslip-print-amount">0</td>
            </tr>
          }
        </tbody>
      </table>

      {}
      <div className="payslip-print-section-title">Income Tax Deduction</div>
      <div className="payslip-print-taxgrid">
        <div><span>Gross Salary</span><span>{num(incomeTax.grossSalary)}</span></div>
        <div><span>Profession Tax</span><span>{num(incomeTax.professionTax)}</span></div>
        <div><span>Total VI A Deduction</span><span>{num(incomeTax.totalVIADeduction)}</span></div>
        <div><span>Total Income</span><span>{num(incomeTax.totalIncome)}</span></div>
        <div><span>Total Tax</span><span>{num(incomeTax.totalTax)}</span></div>
        <div><span>Education Cess</span><span>{num(incomeTax.educationCess)}</span></div>
        <div><span>Tax Deducted (Previous Employer)</span><span>{num(incomeTax.taxDeductedPrevEmployer)}</span></div>
        <div><span>Tax Deducted Till Date</span><span>{num(incomeTax.taxDeductedTillDate)}</span></div>
        <div><span>Tax to be Deducted</span><span>{num(incomeTax.taxToBeDeducted)}</span></div>
        <div><span>Monthly Projected Tax</span><span>{num(incomeTax.monthlyProjectedTax)}</span></div>
      </div>

      {}
      <div className="payslip-print-section-title">Tax Paid Details</div>
      <table className="payslip-print-monthgrid">
        <thead>
          <tr>
            {FY_MONTH_LABELS.slice(0, 6).map((m) =>
            <th key={m}>{m}</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            {FY_MONTH_LABELS.slice(0, 6).map((m) =>
            <td key={m}>{taxPaidByMonth[m] != null ? num(taxPaidByMonth[m]) : ""}</td>
            )}
          </tr>
        </tbody>
        <thead>
          <tr>
            {FY_MONTH_LABELS.slice(6).map((m) =>
            <th key={m}>{m}</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            {FY_MONTH_LABELS.slice(6).map((m) =>
            <td key={m}>{taxPaidByMonth[m] != null ? num(taxPaidByMonth[m]) : ""}</td>
            )}
          </tr>
        </tbody>
      </table>

      <p className="payslip-print-footer">
        This is a computer generated payslip and does not require a signature
      </p>
    </div>);

}
