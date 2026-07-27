import { Clock, CheckCircle2, XCircle } from "lucide-react";
import React from "react";

export const SEC123_ITEMS = [
  { section: "123", label: "5 Years of Fixed Deposit in Scheduled Bank", max: "1,50,000.00" },
  { section: "123", label: "Children Tuition Fees", max: "1,50,000.00" },
  { section: "123", label: "Contribution to Pension Fund", max: "1,50,000.00" },
  { section: "123", label: "Deposit in NSC", max: "1,50,000.00" },
  { section: "123", label: "Deposit in NSS", max: "1,50,000.00" },
  { section: "123", label: "Deposit in Post Office Savings Schemes", max: "1,50,000.00" },
  { section: "123", label: "Equity Linked Savings Scheme ( ELSS )", max: "1,50,000.00" },
  { section: "123", label: "Interest on NSC Reinvested", max: "1,50,000.00" },
  { section: "123", label: "Life Insurance Premium", max: "1,50,000.00" },
  { section: "123", label: "Long term Infrastructure Bonds", max: "1,50,000.00" },
  { section: "123", label: "Mutual Funds", max: "1,50,000.00" },
  { section: "123", label: "NABARD Rural Bonds", max: "1,50,000.00" },
  { section: "123", label: "National Pension Scheme", max: "1,50,000.00" },
  { section: "123", label: "NHB Scheme", max: "1,50,000.00" },
  { section: "123", label: "Post office time deposit for 5 years", max: "1,50,000.00" },
  { section: "123", label: "Pradhan Mantri Suraksha Bima Yojana", max: "1,50,000.00" },
  { section: "123", label: "Public Provident Fund", max: "1,50,000.00" },
  { section: "123", label: "Repayment of Housing loan(Principal amount)", max: "1,50,000.00" },
  { section: "123", label: "Stamp duty and Registration charges", max: "1,50,000.00" },
  { section: "123", label: "Sukanya Samriddhi Yojana", max: "1,50,000.00" },
  { section: "123", label: "Unit Linked Insurance Premium (ULIP)", max: "1,50,000.00" },
];

export const CH8_ITEMS = [
  { section: "130", label: "Additional Interest on housing loan borrowed as on 1st Apr 2016", max: "50,000.00" },
  { section: "131", label: "Additional Interest on Housing loan borrowed as on 1st Apr 2019", max: "1,50,000.00" },
  { section: "137", label: "Donations made to Political Party or Electoral Trust", max: "9,99,99,999.00" },
  { section: "135", label: "Donations made for Scientific Research or Rural Development", max: "9,99,99,999.00" },
  { section: "124(5)", label: "Employee Contribution to NPS", max: "1,50,000.00" },
  { section: "132", label: "Interest on Electric Vehicle borrowed as on 1st Apr 2019", max: "1,50,000.00" },
  { section: "124(3)", label: "Contribution to NPS 2015", max: "50,000.00" },
  { section: "19(1)(10)", label: "Retrenchment Compensation", max: "5,00,000.00" },
  { section: "153(2)(b)", label: "Interest on Deposits in Savings Account, Post Office And Cooperative Society for Senior Citizen", max: "50,000.00" },
  { section: "133", label: "Donation - 100% Exemption", max: "9,99,99,999.00" },
  { section: "133", label: "Donation - 50% Exemption", max: "9,99,99,999.00" },
  { section: "133", label: "Donation - Children Education", max: "9,99,99,999.00" },
  { section: "133", label: "Donation - Political Parties", max: "9,99,99,999.00" },
  { section: "153(2)(a)", label: "Interest on Deposits in Savings Account, Post Office And Cooperative Society", max: "10,000.00" },
  { section: "129", label: "Interest on Loan of higher Self education", max: "9,99,99,999.00" },
  { section: "127", label: "Medical Treatment / Insurance of handicapped Dependant - (Between 40% - 80%)", max: "75,000.00" },
  { section: "127", label: "Medical Treatment / Insurance of handicapped Dependant (Severe - Above 80%)", max: "1,25,000.00" },
  { section: "128", label: "Medical Treatment ( Specified Disease only )", max: "40,000.00" },
  { section: "128", label: "Medical Treatment (Specified Disease only)- Senior Citizen", max: "1,00,000.00" },
  { section: "154", label: "Permanent Physical Disability (Above 80%)", max: "1,25,000.00" },
  { section: "154", label: "Permanent Physical Disability (Between 40% - 80%)", max: "75,000.00" },
];

export const MED_ITEMS = [
  { key: "checkupParents", section: "80D", label: "Preventive Health Checkup - Dependant Parents", max: "5,000.00" },
  { key: "medBillsSenior", section: "80D", label: "Medical Bills - Senior Citizen (>60)", max: "50,000.00" },
  { key: "medInsurance", section: "80D", label: "Medical Insurance Premium", max: "25,000.00", hasAge: true },
  { key: "medInsParents", section: "80D", label: "Medical Insurance Premium - Dependant Parents", max: "50,000.00", hasParentAge: true },
  { key: "preventiveCheckup", section: "80D", label: "Preventive Health Check-up", max: "5,000.00" },
];

export const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const LANDLORD_RELATIONS = ["Spouse", "Parent", "Sibling", "Friend", "Other"];

export const STATUS_CFG = {
  draft: { bg: '#fef9c3', color: '#a16207', icon: React.createElement(Clock, { size: 14 }), label: 'Draft' },
  submitted: { bg: '#dbeafe', color: '#1d4ed8', icon: React.createElement(Clock, { size: 14 }), label: 'Submitted — Pending Review' },
  approved: { bg: '#dcfce7', color: '#15803d', icon: React.createElement(CheckCircle2, { size: 14 }), label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#dc2626', icon: React.createElement(XCircle, { size: 14 }), label: 'Rejected' },
};
